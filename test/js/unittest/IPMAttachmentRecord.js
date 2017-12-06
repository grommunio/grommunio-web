describe('IPMAttachmentRecord', function() {
  var record;

  beforeEach(function() {
    record = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.mapi.ObjectType.MAPI_ATTACH, {});
  });

  it('setInline', function() {
    record.setInline(false);
    expect(record.isInline()).toBeFalsy();
    record.setInline(true);
    expect(record.isInline()).toBeTruthy();
  });

  describe('isUploaded', function() {
    it('default', function() {
      expect(record.isUploaded()).toBeFalsy();
    });

    it('tmpname set', function() {
      record.set('tmpname', 'woof');
      expect(record.isUploaded()).toBeTruthy();
    });

    it('attach_num > -1', function() {
      record.set('attach_num', 0);
      expect(record.isUploaded()).toBeTruthy();
    });

    it('attach_num < 0', function() {
      record.set('attach_num', -1);
      expect(record.isUploaded()).toBeFalsy();
    });
  });
 
  describe('isTmpFile', function() {
    it('default', function() {
      expect(record.isTmpFile()).toBeTruthy();
    });

    it('true', function() {
      record.set('attach_num', 0);
      expect(record.isTmpFile()).toBeFalsy();
    });
  });

  describe('isHidden', function() {
    it('default', function() {
      expect(record.isHidden()).toBeFalsy();
    });

    it('true', function() {
      record.set('hidden', true);
      expect(record.isTmpFile()).toBeTruthy();
    });
  });

  describe('isContactPhoto', function() {
    it('default', function() {
      expect(record.isContactPhoto()).toBeFalsy();
    });

    it('true', function() {
      record.set('attachment_contactphoto', 'henk');
      expect(record.isContactPhoto()).toBeTruthy();
    });
  });

  describe('attemptedToUpload', function() {
    it('default', function() {
      expect(record.attemptedToUpload()).toBeFalsy();
    });

    it('true', function() {
      record.uploadAttempted = true;
      expect(record.attemptedToUpload()).toBeTruthy();
    });
  });

  describe('canBeImported', function() {
    it('default', function() {
      expect(record.canBeImported()).toBeFalsy();
    });

    it('eml', function() {
      record.set('extension', 'eml');
      expect(record.canBeImported()).toBeTruthy();
    });

    it('vcf', function() {
      record.set('extension', 'vcf');
      expect(record.canBeImported()).toBeTruthy();
    });
  });
});
