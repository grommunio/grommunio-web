/**
 * Reader for the Compound File Binary format ([MS-CFB]), the container the
 * pre-XML Office formats keep their streams in. Reading only, by stream name.
 *
 * @author grommunio GmbH <dev@grommunio.com>
 */

/*global window, TextDecoder*/

var CompoundFile = (function () {
    "use strict";

    var kSignature       = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1],
        kEndOfChain      = 0xFFFFFFFE,
        kFreeSector      = 0xFFFFFFFF,
        kMaxRegularSector = 0xFFFFFFFA,
        kDirectoryEntry  = 128;

    /**
     * Read a compound file.
     *
     * @param {ArrayBuffer} buffer The whole file
     * @return {Object} streams, keyed by the name of the directory entry
     */
    function read( buffer ) {
        var bytes = new Uint8Array(buffer),
            view  = new DataView(buffer),
            i;

        for ( i = 0; i < kSignature.length; i += 1 ) {
            if ( bytes[i] !== kSignature[i] ) {
                throw new Error('not a compound file');
            }
        }

        var sectorSize     = 1 << view.getUint16(30, true),
            miniSectorSize = 1 << view.getUint16(32, true),
            fatCount       = view.getUint32(44, true),
            directoryStart = view.getUint32(48, true),
            miniCutoff     = view.getUint32(56, true),
            miniFatStart   = view.getUint32(60, true),
            difatStart     = view.getUint32(68, true),
            difatCount     = view.getUint32(72, true);

        /**
         * The offset a sector starts at. Sector 0 follows the 512 byte header.
         */
        function sectorOffset( sector ) {
            return (sector + 1) * sectorSize;
        }

        /**
         * The sectors holding the file allocation table, which the header
         * lists directly up to 109 of and in a chain of its own beyond that.
         */
        function readDifat() {
            var sectors = [],
                sector  = difatStart,
                entries = sectorSize / 4 - 1,
                guard   = 0,
                base,
                j;

            for ( j = 0; j < 109 && j < fatCount; j += 1 ) {
                sectors.push(view.getUint32(76 + j * 4, true));
            }

            while ( sector <= kMaxRegularSector && guard < difatCount + 1 ) {
                base = sectorOffset(sector);
                for ( j = 0; j < entries; j += 1 ) {
                    sectors.push(view.getUint32(base + j * 4, true));
                }
                sector = view.getUint32(base + entries * 4, true);
                guard += 1;
            }

            return sectors;
        }

        /**
         * The allocation table itself: for every sector, the sector that
         * follows it.
         */
        function readTable( sectors ) {
            var table = [],
                base,
                j,
                k;

            for ( j = 0; j < sectors.length; j += 1 ) {
                if ( sectors[j] > kMaxRegularSector ) {
                    continue;
                }
                base = sectorOffset(sectors[j]);
                for ( k = 0; k < sectorSize / 4; k += 1 ) {
                    table.push(view.getUint32(base + k * 4, true));
                }
            }

            return table;
        }

        var fat = readTable(readDifat());

        /**
         * Walk a chain of sectors from its first one.
         */
        function chain( start ) {
            var sectors = [],
                sector  = start;

            while ( sector <= kMaxRegularSector && sectors.length < fat.length ) {
                sectors.push(sector);
                sector = fat[sector];
                if ( sector === undefined || sector === kFreeSector ) {
                    break;
                }
            }

            return sectors;
        }

        /**
         * The bytes of a chain, cut to the length of the stream.
         */
        function readChain( start, size, chunkSize, offsetOf ) {
            var sectors = chain(start),
                total   = size === undefined ? sectors.length * chunkSize : size,
                out     = new Uint8Array(total),
                written = 0,
                take,
                j;

            for ( j = 0; j < sectors.length && written < total; j += 1 ) {
                take = Math.min(chunkSize, total - written);
                out.set(bytes.subarray(offsetOf(sectors[j]), offsetOf(sectors[j]) + take), written);
                written += take;
            }

            return out;
        }

        var miniFat      = [],
            miniChain    = null,
            directory    = readChain(directoryStart, undefined, sectorSize, sectorOffset),
            directoryView = new DataView(directory.buffer, directory.byteOffset, directory.byteLength),
            entries      = [],
            count        = Math.floor(directory.length / kDirectoryEntry),
            decoder      = new TextDecoder('utf-16le'),
            entry,
            nameLength,
            offset;

        for ( i = 0; i < count; i += 1 ) {
            offset     = i * kDirectoryEntry;
            nameLength = directoryView.getUint16(offset + 64, true);
            if ( nameLength < 2 ) {
                continue;
            }
            entry = {
                // The length counts the terminating null as well.
                name:  decoder.decode(directory.subarray(offset, offset + nameLength - 2)),
                type:  directory[offset + 66],
                start: directoryView.getUint32(offset + 116, true),
                // A stream longer than 4 GB cannot occur here.
                size:  directoryView.getUint32(offset + 120, true)
            };
            entries.push(entry);
        }

        // The mini stream holds the streams below the cutoff, and lives in
        // the chain the root entry points at.
        function miniStream() {
            var root;

            if ( miniChain === null ) {
                root      = entries[0];
                miniChain = root ? readChain(root.start, root.size, sectorSize, sectorOffset) : new Uint8Array(0);
                miniFat   = [];
                chain(miniFatStart).forEach(function ( sector ) {
                    var base = sectorOffset(sector),
                        j;
                    for ( j = 0; j < sectorSize / 4; j += 1 ) {
                        miniFat.push(view.getUint32(base + j * 4, true));
                    }
                });
            }

            return miniChain;
        }

        function readMini( start, size ) {
            var mini    = miniStream(),
                out     = new Uint8Array(size),
                written = 0,
                sector  = start,
                take;

            while ( sector <= kMaxRegularSector && written < size ) {
                take = Math.min(miniSectorSize, size - written);
                out.set(mini.subarray(sector * miniSectorSize, sector * miniSectorSize + take), written);
                written += take;
                sector   = miniFat[sector];
                if ( sector === undefined ) {
                    break;
                }
            }

            return out;
        }

        var streams = {};
        entries.forEach(function ( item, index ) {
            // Type 2 is a stream; the root entry is type 5.
            if ( item.type !== 2 || index === 0 ) {
                return;
            }
            streams[item.name] = item.size < miniCutoff ?
                readMini(item.start, item.size) :
                readChain(item.start, item.size, sectorSize, sectorOffset);
        });

        return streams;
    }

    return { read: read };
}());
