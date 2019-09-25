/**
 * Word Import JavaScript Library
 * Copyright (c) 2013-2015 Ephox Corp. All rights reserved.
 * This software is provided "AS IS," without a warranty of any kind.
 */
function com_ephox_keurig_Keurig(){var Pb='',Qb='" for "gwt:onLoadErrorFn"',Rb='" for "gwt:onPropertyErrorFn"',Sb='"><\/script>',Tb='#',Ub='&',Vb='/',Wb=':',Xb=':1',Yb=':2',Zb=':3',$b=':4',_b=':5',ac=':6',bc=':7',cc=':8',dc=':9',ec='<script id="',fc='=',gc='?',hc='Bad handler "',ic='DOMContentLoaded',jc='E63F406900A158D6A38141383C0471B5',kc='SCRIPT',lc='Single-script hosted mode not yet implemented. See issue ',mc='Unexpected exception in locale detection, using default: ',nc='_',oc='__gwt_Locale',pc='__gwt_marker_com.ephox.keurig.Keurig',qc='base',rc='clear.cache.gif',sc='com.ephox.keurig.Keurig',tc='content',uc='default',vc='en',wc='gecko',xc='gecko1_8',yc='gwt.codesvr=',zc='gwt.hosted=',Ac='gwt.hybrid',Bc='gwt:onLoadErrorFn',Cc='gwt:onPropertyErrorFn',Dc='gwt:property',Ec='http://code.google.com/p/google-web-toolkit/issues/detail?id=2079',Fc='ie10',Gc='ie8',Hc='ie9',Ic='img',Jc='locale',Kc='locale=',Lc='meta',Mc='msie',Nc='name',Oc='safari',Pc='unknown',Qc='user.agent',Rc='webkit';var k=Pb,l=Qb,m=Rb,n=Sb,o=Tb,p=Ub,q=Vb,r=Wb,s=Xb,t=Yb,u=Zb,v=$b,w=_b,A=ac,B=bc,C=cc,D=dc,F=ec,G=fc,H=gc,I=hc,J=ic,K=jc,L=kc,M=lc,N=mc,O=nc,P=oc,Q=pc,R=qc,S=rc,T=sc,U=tc,V=uc,W=vc,X=wc,Y=xc,Z=yc,$=zc,_=Ac,ab=Bc,bb=Cc,cb=Dc,db=Ec,eb=Fc,fb=Gc,gb=Hc,hb=Ic,ib=Jc,jb=Kc,kb=Lc,lb=Mc,mb=Nc,nb=Oc,ob=Pc,pb=Qc,qb=Rc;var rb=window,sb=document,tb,ub,vb=k,wb={},xb=[],yb=[],zb=[],Ab=0,Bb,Cb;if(!rb.__gwt_stylesLoaded){rb.__gwt_stylesLoaded={}}if(!rb.__gwt_scriptsLoaded){rb.__gwt_scriptsLoaded={}}function Db(){var b=false;try{var c=rb.location.search;return (c.indexOf(Z)!=-1||(c.indexOf($)!=-1||rb.external&&rb.external.gwtOnLoad))&&c.indexOf(_)==-1}catch(a){}Db=function(){return b};return b}
function Eb(){if(tb&&ub){tb(Bb,T,vb,Ab)}}
function Fb(){var e,f=Q,g;sb.write(F+f+n);g=sb.getElementById(f);e=g&&g.previousSibling;while(e&&e.tagName!=L){e=e.previousSibling}function h(a){var b=a.lastIndexOf(o);if(b==-1){b=a.length}var c=a.indexOf(H);if(c==-1){c=a.length}var d=a.lastIndexOf(q,Math.min(c,b));return d>=0?a.substring(0,d+1):k}
;if(e&&e.src){vb=h(e.src)}if(vb==k){var i=sb.getElementsByTagName(R);if(i.length>0){vb=i[i.length-1].href}else{vb=h(sb.location.href)}}else if(vb.match(/^\w+:\/\//)){}else{var j=sb.createElement(hb);j.src=vb+S;vb=h(j.src)}if(g){g.parentNode.removeChild(g)}}
function Gb(){var b=document.getElementsByTagName(kb);for(var c=0,d=b.length;c<d;++c){var e=b[c],f=e.getAttribute(mb),g;if(f){if(f==cb){g=e.getAttribute(U);if(g){var h,i=g.indexOf(G);if(i>=0){f=g.substring(0,i);h=g.substring(i+1)}else{f=g;h=k}wb[f]=h}}else if(f==bb){g=e.getAttribute(U);if(g){try{Cb=eval(g)}catch(a){alert(I+g+m)}}}else if(f==ab){g=e.getAttribute(U);if(g){try{Bb=eval(g)}catch(a){alert(I+g+l)}}}}}}
function Hb(a,b){return b in xb[a]}
function Ib(a){var b=wb[a];return b==null?null:b}
function Jb(a,b){var c=zb;for(var d=0,e=a.length-1;d<e;++d){c=c[a[d]]||(c[a[d]]=[])}c[a[e]]=b}
function Kb(a){var b=yb[a](),c=xb[a];if(b in c){return b}var d=[];for(var e in c){d[c[e]]=e}if(Cb){Cb(a,d,b)}throw null}
yb[ib]=function(){var b=null;var c=V;try{if(!b){var d=location.search;var e=d.indexOf(jb);if(e>=0){var f=d.substring(e+7);var g=d.indexOf(p,e);if(g<0){g=d.length}b=d.substring(e+7,g)}}if(!b){b=Ib(ib)}if(!b){b=rb[P]}if(b){c=b}while(b&&!Hb(ib,b)){var h=b.lastIndexOf(O);if(h<0){b=null;break}b=b.substring(0,h)}}catch(a){alert(N+a)}rb[P]=c;return b||V};xb[ib]={'default':0,en:1};yb[pb]=function(){var b=navigator.userAgent.toLowerCase();var c=function(a){return parseInt(a[1])*1000+parseInt(a[2])};if(function(){return b.indexOf(qb)!=-1}())return nb;if(function(){return b.indexOf(lb)!=-1&&sb.documentMode>=10}())return eb;if(function(){return b.indexOf(lb)!=-1&&sb.documentMode>=9}())return gb;if(function(){return b.indexOf(lb)!=-1&&sb.documentMode>=8}())return fb;if(function(){return b.indexOf(X)!=-1}())return Y;return ob};xb[pb]={gecko1_8:0,ie10:1,ie8:2,ie9:3,safari:4};com_ephox_keurig_Keurig.onScriptLoad=function(a){com_ephox_keurig_Keurig=null;tb=a;Eb()};if(Db()){alert(M+db);return}Fb();Gb();try{var Lb;Jb([V,Y],K);Jb([V,eb],K+s);Jb([V,fb],K+t);Jb([V,gb],K+u);Jb([V,nb],K+v);Jb([W,Y],K+w);Jb([W,eb],K+A);Jb([W,fb],K+B);Jb([W,gb],K+C);Jb([W,nb],K+D);Lb=zb[Kb(ib)][Kb(pb)];var Mb=Lb.indexOf(r);if(Mb!=-1){Ab=Number(Lb.substring(Mb+1))}}catch(a){return}var Nb;function Ob(){if(!ub){ub=true;Eb();if(sb.removeEventListener){sb.removeEventListener(J,Ob,false)}if(Nb){clearInterval(Nb)}}}
if(sb.addEventListener){sb.addEventListener(J,function(){Ob()},false)}var Nb=setInterval(function(){if(/loaded|complete/.test(sb.readyState)){Ob()}},50)}
com_ephox_keurig_Keurig();(function () {var $gwt_version = "2.6.1";var $wnd = window;var $doc = $wnd.document;var $moduleName, $moduleBase;var $stats = $wnd.__gwtStatsEvent ? function(a) {$wnd.__gwtStatsEvent(a)} : null;var $strongName = 'E63F406900A158D6A38141383C0471B5';function u(){}
function W(){}
function Fo(){}
function Fh(){}
function jh(){}
function Hh(){}
function qb(){}
function ac(){}
function Lc(){}
function Oc(){}
function Rg(){}
function _g(){}
function _n(){}
function hk(){}
function lk(){}
function pk(){}
function tk(){}
function xk(){}
function Nk(){}
function Bg(a){}
function qc(){ec()}
function qd(){od()}
function td(){od()}
function Ad(){xd()}
function nf(){mf()}
function tf(){sf()}
function zf(){yf()}
function If(){Hf()}
function Sf(){Rf()}
function yh(){nh()}
function ab(){Z(this)}
function Wl(){Ul(this)}
function hm(){$l(this)}
function im(){$l(this)}
function Tm(a){this.b=a}
function T(a){this.b=a}
function yb(a){this.b=a}
function en(a){this.b=a}
function Sn(a){this.b=a}
function An(a){this.c=a}
function _b(a,b){a.b=b}
function $d(a,b){a.i=b}
function Ch(a,b){a.b+=b}
function Dh(a,b){a.b+=b}
function _d(a,b){a.h=a.i=b}
function Ul(a){a.b=new Fh}
function $l(a){a.b=new Fh}
function Hg(){return Dg}
function sb(){sb=Fo;Rb()}
function jg(){jg=Fo;ig=new u}
function Og(){Og=Fo;Ng=new Rg}
function Zn(){Zn=Fo;Yn=new _n}
function Eo(){Eo=Fo;Do=new Bo}
function Ek(){gg.call(this)}
function Xk(){gg.call(this)}
function Zk(){gg.call(this)}
function al(){gg.call(this)}
function gl(){gg.call(this)}
function no(){gg.call(this)}
function Fk(a){hg.call(this,a)}
function $k(a){hg.call(this,a)}
function bl(a){hg.call(this,a)}
function pm(a){hg.call(this,a)}
function kl(a){$k.call(this,a)}
function gg(){Sj().C(this)}
function ee(a){this.b=Bl(a+wp)}
function Wf(a,b){a.b[a.c++]=b}
function Yd(a,b){return a.i+=b}
function Td(a,b){return a.f[b]}
function el(a,b){return a<b?a:b}
function xb(a,b){return tb(b,a.b)}
function ck(b,a){return b.exec(a)}
function Hm(b,a){return b.f[Jp+a]}
function _j(a){return new Zj[a]}
function ak(){return !!$stats}
function yn(a){return a.b<a.c.M()}
function Ud(a,b){return a.f[b]<=32}
function Kd(a,b){return Ld(a,b,a.k)}
function Od(a,b){return Pd(a,b,a.k)}
function Vg(a){return Zg((Sj(),a))}
function vo(a){wo.call(this,a,0)}
function zo(a,b,c){Km(a.b,b,c)}
function bm(a,b){return pl(a.b.b,b)}
function Jm(b,a){return Jp+a in b.f}
function Hb(a){_l(a.d,dp);--a.b}
function Mb(a,b){_l(a.d,Jb(b));++a.b}
function Vl(a,b){Ch(a.b,b);return a}
function _l(a,b){Ch(a.b,b);return a}
function io(a,b){this.b=a;this.c=b}
function kn(a,b){this.c=a;this.b=b}
function Xl(a){Ul(this);Ch(this.b,a)}
function jm(a){$l(this);Ch(this.b,a)}
function hg(a){this.f=a;Sj().C(this)}
function Hn(){this.b=Mh(Lj,Jo,0,0,0)}
function Ih(a){return Jh(a,a.length)}
function Jg(a,b){return Gh(a,b,null)}
function _h(a){return a==null?null:a}
function Wg(a){return parseInt(a)||-1}
function tl(b,a){return b.indexOf(a)}
function Rc(a,b){return b<256&&a.b[b]}
function Vh(a,b){return a.cM&&a.cM[b]}
function Kk(a){return Lk(a)==a&&Ik(a)}
function El(a){return Mh(Nj,Jo,1,a,0)}
function dd(a,b){return a.b[b>=128?0:b]}
function sn(a,b){(a<0||a>=b)&&vn(a,b)}
function Nn(a,b,c,d){a.splice(b,c,d)}
function Kg(a){$wnd.clearTimeout(a)}
function Lb(a){fm(a.d);a.c=true}
function Pl(){Pl=Fo;Ml={};Ol={}}
function ke(){ke=Fo;je=Bl('class=')}
function ye(){ye=Fo;xe=Bl(ap);we=Bl(sp)}
function Ze(){Ze=Fo;Ye=Bl(up);Xe=Bl(vp)}
function od(){od=Fo;jd();nd=Bl('style=')}
function mc(a){a.f=false;a.d=null;a.b=0}
function Zd(a,b,c){a.f=b;a.k=c;a.h=a.i=0}
function Q(a,b){I();this.c=a;this.b=b}
function Uh(a,b){return a.cM&&!!a.cM[b]}
function Yh(a,b){return a!=null&&Uh(a,b)}
function $h(a){return a.tM==Fo||Uh(a,1)}
function Gg(a){return a.$H||(a.$H=++xg)}
function pl(b,a){return b.charCodeAt(a)}
function vl(b,a){return b.lastIndexOf(a)}
function ul(c,a,b){return c.indexOf(a,b)}
function Al(c,a,b){return c.substr(a,b-a)}
function dk(c,a,b){return a.replace(c,b)}
function ek(a,b){return new RegExp(a,b)}
function Wc(a,b){return Wd(a,b)&&Id(a,62)}
function gm(a,b,c){return Al(a.b.b,b,c)}
function cm(a,b,c){return Eh(a.b,b,c,Zo),a}
function pc(a,b,c,d){return d==b&&a.b==c}
function Cc(a,b){return b==41||b==46?a+1:a}
function ic(a,b){return a.b==0?gc(b):hc(a,b)}
function Co(a,b){return a!=null?a[b]:null}
function ng(a){return a==null?null:a.name}
function mg(a){return a==null?null:a.message}
function Il(a){return String.fromCharCode(a)}
function wl(c,a,b){return c.lastIndexOf(a,b)}
function Ag(a,b,c){return a.apply(b,c);var d}
function Xf(a,b,c,d){nm(b,c,a.b,a.c,d);a.c+=d}
function em(a,b,c,d){Eh(a.b,b,c,d);return a}
function En(a,b){Oh(a.b,a.c++,b);return true}
function ro(a){a.e=ck(a.c,a.b);return !!a.e}
function Sk(a){var b=Zj[a.d];a=null;return b}
function $g(){try{null.a()}catch(a){return a}}
function sg(a){var b;return b=a,$h(b)?b.cZ:Ii}
function He(a){Fe();this.b=Be;this.b=a?Ce:Be}
function Bo(){this.b=new go;new go;new go}
function Bb(){Bb=Fo;Ab=new vo('level(\\d)\\s')}
function Uc(){Uc=Fo;Tc=Bl('<v:imagedata ')}
function Ve(){Ve=Fo;Ue=Bl('/*');Te=Bl('*/')}
function I(){I=Fo;G=(Zn(),Zn(),Yn);H=new T(G)}
function Rh(){Rh=Fo;Ph=[];Qh=[];Sh(new Hh,Ph,Qh)}
function nh(){nh=Fo;Error.stackTraceLimit=128}
function zl(b,a){return b.substr(a,b.length-a)}
function ub(a,b,c){return J(kb(a,b,c),new yb(a))}
function dm(a,b){return ul(a.b.b,'mso-list:',b)}
function so(a){return xl(dk(a.c,a.b,'$1'),$o,_o)}
function Tk(a){return typeof a=='number'&&a>0}
function Zh(a){return a!=null&&a.tM!=Fo&&!Uh(a,1)}
function Eh(a,b,c,d){a.b=Al(a.b,0,b)+d+zl(a.b,c)}
function Ll(a,b){Dl(a.length,b);return Gl(a,0,b)}
function am(a,b){Dh(a.b,Gl(b,0,b.length));return a}
function Sg(a,b){!a&&(a=[]);a[a.length]=b;return a}
function Xg(a,b){a.length>=b&&a.splice(0,b);return a}
function Cb(a,b){if(a.c){a.c=false;_l(a.d,Jb(b))}}
function Z(a){if(!Y){Y=true;Eo();zo(Do,gi,a);$(a)}}
function M(a,b){I();return new Q(new T(a),new T(b))}
function tg(a){var b;return b=a,$h(b)?b.hC():Gg(b)}
function rg(a,b){var c;return c=a,$h(c)?c.eQ(b):c===b}
function Sb(a,b,c){var d;d=new Lc;return Wb(a,b,c,d)}
function Vb(a,b,c){var d;d=new Oc;return Wb(a,b,c,d)}
function bd(a,b){var c;c=a.f;Zd(a,b.b,b.c);b.b=c;b.c=0}
function Zf(a){this.b=Mh(Jj,Lo,-1,a,1);this.c=0}
function Nb(){Bb();this.d=new hm;this.b=1;this.c=true}
function Gb(a,b,c){while(a.b>1){Eh(b.b,c,c,dp);--a.b}}
function ml(a,b,c){this.b=Lp;this.e=a;this.c=b;this.d=c}
function Km(a,b,c){return !b?Mm(a,c):Lm(a,b,c,~~Gg(b))}
function fo(a,b){return _h(a)===_h(b)||a!=null&&rg(a,b)}
function oo(a,b){return _h(a)===_h(b)||a!=null&&rg(a,b)}
function vn(a,b){throw new bl('Index: '+a+', Size: '+b)}
function Re(){Re=Fo;Qe=Bl('xmlns');Pe=Bl('<html')}
function xd(){xd=Fo;jd();vd=Bl('\n\r{');wd=Bl(' \t,')}
function Ed(){Ed=Fo;Cd=Bl(up);Bd=Bl(vp);Ve();Dd=new Ad}
function mf(){mf=Fo;se();ye();gf();lf=new Sc('<\n\r')}
function yf(){yf=Fo;se();ye();gf();ke();xf=new Sc('<c\n\r')}
function he(){he=Fo;fe=new Sc(xp);ge=new Sc(' \t\r\n')}
function gf(){gf=Fo;ef=new Sc(' >\r\n\t');ff=new Sc(xp)}
function Ig(a){$wnd.setTimeout(function(){throw a},0)}
function Lg(){return Jg(function(){wg!=0&&(wg=0);zg=-1},10)}
function Sl(){if(Nl==256){Ml=Ol;Ol={};Nl=0}++Nl}
function Eb(a,b,c){Cb(a,c);_l(a.d,ep);_l(a.d,b);_l(a.d,fp)}
function Mh(a,b,c,d,e){var f;f=Lh(e,d);Nh(a,b,c,f);return f}
function Wh(a,b){if(a!=null&&!Vh(a,b)){throw new Xk}return a}
function ql(a,b){if(!Yh(b,1)){return false}return String(a)==b}
function xl(c,a,b){b=Fl(b);return c.replace(RegExp(a,Yp),b)}
function mm(a){bl.call(this,'String index out of range: '+a)}
function Hk(a){return null!=String.fromCharCode(a).match(/\d/)}
function zn(a){if(a.b>=a.c.M()){throw new no}return a.c.W(a.b++)}
function Dl(a,b){if(b<0){throw new mm(b)}if(b>a){throw new mm(b)}}
function vb(a,b){sb();this.b=nb(new qb,a);this.c=b;this.d=true}
function Kb(a,b){var c;c=a.d+dp;fm(a.d);a.c=true;b.e=0;return c}
function $b(a,b){var c;c=a.b;while(pl(b.b.b,c)!=60){--c}return c}
function xc(a,b){var c;c=b;while(bm(a.c,c)!=62){++c}return c+1}
function wc(a,b){var c;c=b;while(bm(a.c,c)!=59){++c}return c+1}
function Mm(a,b){var c;c=a.c;a.c=b;if(!a.d){a.d=true;++a.e}return c}
function Pk(a,b,c){var d;d=new Nk;d.e=a+b;Tk(c)&&Uk(c,d);return d}
function Nh(a,b,c,d){Rh();Th(d,Ph,Qh);d.cZ=a;d.cM=b;d.qI=c;return d}
function fc(a,b,c,d){a.c=d;a.b=pl(b.b.b,c);a.e=a.b-d.charCodeAt(0)+1}
function sl(a,b,c,d){var e;for(e=0;e<b;++e){c[d++]=a.charCodeAt(e)}}
function Eg(a,b,c){var d;d=Cg();try{return Ag(a,b,c)}finally{Fg(d)}}
function On(a,b,c,d){Array.prototype.splice.apply(a,[b,c].concat(d))}
function Yf(a){for(;a.c>0;a.c--){if(a.b[a.c-1]>32){break}}}
function ug(a){return a.toString?a.toString():'[JavaScriptObject]'}
function Ik(a){return null!=String.fromCharCode(a).match(/[A-Z]/i)}
function cf(){cf=Fo;bf=Bl('<![if');af=Bl(yp);_e=Bl('<![endif]>')}
function pe(){pe=Fo;oe=Bl('<!--[if');ne=Bl(yp);me=Bl('<![endif]-->')}
function sf(){sf=Fo;pe();cf();Ne();Re();Uc();rf=new Sc('<x\n\r')}
function Fg(a){a&&Qg((Og(),Ng));--wg;if(a){if(zg!=-1){Kg(zg);zg=-1}}}
function Ac(a,b){var c;c=bm(a.c,b);return c==10||c==32||c==13||c==160}
function Kh(a,b){var c,d;c=a;d=Lh(0,b);Nh(c.cZ,c.cM,c.qI,d);return d}
function Qk(a,b){var c;c=new Nk;c.e=a+b;Tk(0)&&Uk(0,c);c.c=2;return c}
function Rk(a,b){var c;c=new Nk;c.e=Zo+a;Tk(b)&&Uk(b,c);c.c=1;return c}
function Jh(a,b){var c,d;c=a;d=c.slice(0,b);Nh(c.cZ,c.cM,c.qI,d);return d}
function Bl(a){var b,c;c=a.length;b=Mh(Jj,Lo,-1,c,1);sl(a,c,b,0);return b}
function nc(a,b,c,d){var e;e=Al(b.b.b,c,c+d);a.e=gb(e);a.b=0;return c+d}
function cb(a,b,c){var d;d=db(a,b,c);if(d>3*c){throw new Zk}else{return d}}
function Xh(a){if(a!=null&&(a.tM==Fo||Uh(a,1))){throw new Xk}return a}
function Gn(a,b,c){for(;c<a.c;++c){if(oo(b,a.b[c])){return c}}return -1}
function Nm(e,a,b){var c,d=e.f;a=Jp+a;a in d?(c=d[a]):++e.e;d[a]=b;return c}
function Sh(a,b,c){var d=0,e;for(var f in a){if(e=a[f]){b[d]=f;c[d]=e;++d}}}
function Th(a,b,c){Rh();for(var d=0,e=b.length;d<e;++d){a[b[d]]=c[d]}}
function go(){this.b=[];this.f={};this.d=false;this.c=null;this.e=0}
function lg(a){jg();gg.call(this);this.b=Zo;this.c=a;this.b=Zo;Sj().A(this)}
function Xj(a){if(Yh(a,17)){return a}return a==null?new lg(null):Vj(a)}
function Lk(a){return String.fromCharCode(a).toUpperCase().charCodeAt(0)}
function Jk(a){return String.fromCharCode(a).toLowerCase().charCodeAt(0)==a&&Ik(a)}
function O(a,b){return R(a.c.b,b.c.b)&&(I(),R(Wh(a.b.b,18),Wh(b.b.b,18)))}
function Fm(a,b){return b==null?a.c:Yh(b,1)?Hm(a,Wh(b,1)):Gm(a,b,~~tg(b))}
function Em(a,b){return b==null?a.d:Yh(b,1)?Jm(a,Wh(b,1)):Im(a,b,~~tg(b))}
function Ym(a){var b;b=new Hn;a.d&&En(b,new en(a));Dm(a,b);Cm(a,b);this.b=new An(b)}
function C(a,b){var c,d;d=new im(a.length*b);for(c=0;c<b;c++){Ch(d.b,a)}return d.b.b}
function zc(a,b,c){var d,e;d=el(b+c.length,a.c.b.b.length);e=gm(a.c,b,d);return rl(e,c)}
function yc(a,b){var c;c=b;while(bm(a.c,c)==46||Hk(bm(a.c,c))){++c}return gm(a.c,b,c)}
function Id(a,b){var c;for(c=a.i;c<a.k;c++){if(a.f[c]==b){a.i=c;return true}}return false}
function Jd(a,b,c){var d;for(d=a.i;d<c;d++){if(a.f[d]==b){a.i=d;return true}}return false}
function Gh(a,b,c){var d=$wnd.setTimeout(function(){a();c!=null&&Bg(c)},b);return d}
function Pg(a){var b,c;if(a.b){c=null;do{b=a.b;a.b=null;c=Tg(b,c)}while(a.b);a.b=c}}
function Qg(a){var b,c;if(a.c){c=null;do{b=a.c;a.c=null;c=Tg(b,c)}while(a.c);a.c=c}}
function rm(a,b){var c;while(a.Q()){c=a.R();if(b==null?c==null:rg(b,c)){return a}}return null}
function Nd(a,b){var c;for(c=a.i;c<a.k;c++){if(Rc(b,a.f[c])){a.i=c;return true}}return false}
function ve(a){if(!ae(a)){return false}if(a.i==a.h){return false}a.h=a.i;return true}
function rl(b,a){if(a==null)return false;return b==a||b.toLowerCase()==a.toLowerCase()}
function R(a,b){if(a==null||b==null){throw new $k('No nulls permitted')}return rg(a,b)}
function Ib(a,b){if(a.c){a.c=false;_l(a.d,Jb(b));_l(a.d,"<li style='list-style: none;'>")}}
function qo(a,b,c){Vl(b,xl(Al(a.b,a.d,a.e.index),$o,_o));Ch(b.b,c);a.d=a.c.lastIndex;return a}
function Ok(a,b,c,d){var e;e=new Nk;e.e=a+b;Tk(c!=0?-c:0)&&Uk(c!=0?-c:0,e);e.c=4;e.b=d;return e}
function U(a){var b,c,d;d=new Hn;for(c=new An(a);c.b<c.c.M();){b=Wh(zn(c),18);Fn(d,b)}return d}
function nb(a,b){var c,d;d=xl(b,'&#39;',cp);a.b=new jm(d);c=true;while(c){c=pb(a)}return a.b.b.b}
function ib(a,b){var c,d,e;e=ul(a,Jl(32),b);d=ul(a,Jl(62),b);c=e<d&&e!=-1?e:d;return Al(a,b,c)}
function Hc(a){var b,c;c=tc(a);b=bm(a.c,c);if(b==40){return oc(a.k,c+1,a.c)}return oc(a.k,c,a.c)}
function Wj(a){var b;if(Yh(a,7)){b=Wh(a,7);if(b.c!==(jg(),ig)){return b.c===ig?null:b.c}}return a}
function We(a){if(!Wd(a,Ue)){return false}a.i+=2;if(!Kd(a,Te)){return false}_d(a,a.i+2);return true}
function $e(a){if(!Wd(a,Ye)){return false}if(!Kd(a,Xe)){return false}_d(a,a.i+Xe.length);return true}
function Fn(a,b){var c,d;c=b.N();d=c.length;if(d==0){return false}On(a.b,a.c,0,c);a.c+=d;return true}
function db(a,b,c){var d;d=0;while(a.b.b.length>0&&a.b.b.charCodeAt(0)==b){Eh(a.b,0,1,Zo);d+=c}return d}
function eb(a,b,c){if(a.b.b.length>0&&a.b.b.charCodeAt(0)==b){Eh(a.b,0,1,Zo);return c}else{return 0}}
function Xd(a,b,c){var d,e,f;for(e=0,f=c.length;e<f;++e){d=c[e];if(Vd(a,b,d)){return true}}return false}
function Bk(a,b,c){c&&(a=a.replace(new RegExp('\\.\\*',Yp),'[\\s\\S]*'));return new RegExp(a,b)}
function to(a,b){var c;this.b=xl(b,'\\u00A0','\uE000');this.c=ek((c=a.b,c.source),Yp)}
function fm(a){var b;b=a.b.b.length;0<b?(Eh(a.b,0,b,Zo),a):0>b&&am(a,Mh(Jj,Lo,-1,-b,1))}
function Dg(c){return function(){try{return Eg(c,this,arguments);var b}catch(a){throw a}}}
function Vj(b){var c=b.__gwt$exception;if(!c){c=new lg(b);try{b.__gwt$exception=c}catch(a){}}return c}
function Sj(){switch(Rj){case 0:case 5:return new jh;case 4:case 9:return new yh;}return new _g}
function $c(){$c=Fo;Yc=Nh(Kj,Jo,6,[new tf,new If,new zf,new nf]);Zc=Nh(Kj,Jo,6,[new tf,new Sf,new nf])}
function Hf(){Hf=Fo;gf();Ed();Gf=new He(false);he();Ef=new qd;Ff=new ee(Ep);Df=new Sc('<lsovwxp')}
function Ne(){Ne=Fo;Je=Bl('<meta');Ke=Bl('name=');Me=Bl('ProgId');Ie=Bl('Generator');Le=Bl('Originator')}
function oc(a,b,c){var d;a.f=false;a.c=null;d=jc(a,c,b);a.d!=null&&!ql(a.d,a.c)&&(a.f=true);a.d=a.c;return d}
function Fc(a){var b,c;if(a.l){b=Kb(a.h,a.k);c=a.d+4;em(a.c,a.o,c,b);a.m=b.length;a.n=a.o+a.m}else{a.n=a.d}a.o=-1}
function Db(a,b,c){if(b>a.b){Ib(a,c);_l(a.d,Jb(c));++a.b}else if(b<a.b){while(b!=a.b){_l(a.d,dp);--a.b}}}
function Dm(e,a){var b=e.f;for(var c in b){if(c.charCodeAt(0)==58){var d=new kn(e,c.substring(1));a.J(d)}}}
function Sd(a,b){var c;c=b;for(;c>=0;c--){if(a.f[c]==62){return false}if(a.f[c]==60){a.i=c;return true}}return false}
function ae(a){var b,c;for(c=a.i;c<a.k;c++){b=a.f[c];if(b!=32&&b!=9&&b!=13&&b!=10){a.i=c;return true}}return false}
function Jb(a){var b,c,d,e;b=(d=a.c,d.length==0?Zo:" type='"+d+cp);c=(e=a.e,e==1?Zo:" start='"+e+cp);return hp+b+c+gp}
function dg(a){var b,c,d;c=Mh(Mj,Jo,16,a.length,0);for(d=0,b=a.length;d<b;++d){if(!a[d]){throw new gl}c[d]=a[d]}}
function Sc(a){var b;this.b=Mh(Oj,Mo,-1,256,2);for(b=0;b<a.length;b++){a.charCodeAt(b)<256&&(this.b[a.charCodeAt(b)]=true)}}
function be(a){this.j=Nh(Pj,No,2,[]);this.f=Mh(Jj,Lo,-1,a.length,1);sl(a,a.length,this.f,0);this.k=a.length;this.h=this.i=0}
function Jc(){this.b=new vo('^\\s*<\/p>\\s*<p([^>])*>(<[^>]*>)*&nbsp;(<[^>]*>)*<\/p>\\s*$');this.e=new vo('^<\/p>\\s*$')}
function Rf(){Rf=Fo;gf();Ze();Qf=new He(true);he();Nf=new td;Of=new ee('class');Pf=new ee(Ep);Mf=new Sc('<lscovwxp')}
function Rl(a){Pl();var b=Jp+a;var c=Ol[b];if(c!=null){return c}c=Ml[b];c==null&&(c=Ql(a));Sl();return Ol[b]=c}
function Gk(a){if(a>=48&&a<58){return a-48}if(a>=97&&a<97){return a-97+10}if(a>=65&&a<65){return a-65+10}return -1}
function fb(a,b,c,d){if(a.b.b.length>1&&a.b.b.charCodeAt(0)==b&&a.b.b.charCodeAt(1)==c){Eh(a.b,0,2,Zo);return d}else{return 0}}
function ue(a,b){var c;c=0;while(a.length>b+c&&null!=String.fromCharCode(a[b+c]).match(/[A-Z\d]/i)){++c}return c}
function oh(a,b){var c;c=ih(a,b);if(c.length==0){return (new _g).D(b)}else{c[0].indexOf('anonymous@@')==0&&(c=Xg(c,1));return c}}
function J(a,b){var c;c=xb(b,Wh(a.c.b,1));return M(c.c.b,U(new Sn(Nh(Lj,Jo,0,[Wh(a.b.b,18),Wh(c.b.b,18)]))))}
function wo(a,b){var c,d;this.b=(c=false,d=Zo,(b&1)!=0&&(d+='m'),(b&2)!=0&&(d+=np),(b&32)!=0&&(c=true),Bk(a,d,c))}
function gwtOnLoad(b,c,d,e){$moduleName=c;$moduleBase=d;Rj=e;if(b)try{Xo(Uj)()}catch(a){b(c)}else{Xo(Uj)()}}
function Ic(a){Gc(a,a.n);while(a.i.b>-1){sc(a);Gc(a,a.d);a.i.b>-1?Dc(a):Fc(a);Gc(a,a.n)}Gb(a.h,a.c,a.n);return a.c.b.b}
function Ec(a){var b;while(a.i.b>-1){b=a.i.b-1;while(b>-1&&bm(a.c,b)!=60){--b}if(b>-1){if(bm(a.c,b+1)==112){break}Gc(a,a.i.b+8)}}}
function pd(a,b,c){var d;if(!Wd(b,nd)){return false}d=b.h;if(!Sd(b,d)){return false}b.i=d;return Qd(b)&&kd(a,b,c,d,b.e,b.d,b.b)}
function Wd(a,b){var c,d;c=b.length-1;if((d=a.i+c)>=a.k){return false}do{if(b[c--]!=a.f[d--]){return false}}while(c>=0);return true}
function Vd(a,b,c){var d,e;e=b;d=c.length-1;if((e+=d)>=a.k){return false}do{if(c[d--]!=a.f[e--]){return false}}while(d>=0);return true}
function Pd(a,b,c){var d,e,f,g;for(g=a.i;g<c;g++){for(e=0,f=b.length;e<f;++e){d=b[e];if(d==a.f[g]){a.i=g;return true}}}return false}
function Md(a,b,c,d){var e,f,g;g=a.k-d+1;for(f=a.i;f<g;f++){for(e=0;e<d;e++){if(b[c+e]!=a.f[f+e]){break}}if(e==d){a.i=f;return true}}return false}
function Im(h,a,b){var c=h.b[b];if(c){for(var d=0,e=c.length;d<e;++d){var f=c[d];var g=f.S();if(h.P(a,g)){return true}}}return false}
function Gm(h,a,b){var c=h.b[b];if(c){for(var d=0,e=c.length;d<e;++d){var f=c[d];var g=f.S();if(h.P(a,g)){return f.T()}}}return null}
function Cm(h,a){var b=h.b;for(var c in b){var d=parseInt(c,10);if(c==d){var e=b[d];for(var f=0,g=e.length;f<g;++f){a.J(e[f])}}}}
function ih(a,b){var c,d,e,f;e=Zh(b)?Xh(b):null;f=e&&e.stack?e.stack.split('\n'):[];for(c=0,d=f.length;c<d;c++){f[c]=a.B(f[c])}return f}
function gc(a){var b,c,d,e;e=Nh(Jj,Lo,-1,[99,100,108,109]);for(c=0,d=e.length;c<d;++c){b=e[c];if(b==a||Lk(b)==Lk(a)){return true}}return false}
function Cg(){var a;if(wg!=0){a=(new Date).getTime();if(a-yg>2000){yg=a;zg=Lg()}}if(wg++==0){Pg((Og(),Ng));return true}return false}
function Gl(a,b,c){var d=Zo;for(var e=b;e<c;){var f=Math.min(e+10000,c);d+=String.fromCharCode.apply(null,a.slice(e,f));e=f}return d}
function Fl(a){var b;b=0;while(0<=(b=a.indexOf('\\',b))){a.charCodeAt(b+1)==36?(a=Al(a,0,b)+'$'+zl(a,++b)):(a=Al(a,0,b)+zl(a,++b))}return a}
function tc(a){var b;b=a.j;while(true){if(bm(a.c,b)==60){b=xc(a,b)}else if(zc(a,b,qp)||zc(a,b,rp)){b=wc(a,b)}else if(Ac(a,b)){++b}else{break}}return b}
function pb(a){var b,c,d,e;c=a.b.b.b.indexOf('mso-number-format:');if(c<0){return false}d=c+18;b=ob(a,d);e=d-18;e>-1&&cm(a.b,e,b);return true}
function Se(a,b){if(!Wd(a,Qe)){return false}if(!Rd(a)){return false}if(!Vd(a,a.m,Pe)){return false}if(!Qd(a)){return false}_d(a,a.b);Yf(b);return true}
function qe(a){if(!Wd(a,oe)){return false}Yd(a,oe.length);if(!Kd(a,ne)){return false}Yd(a,ne.length);if(!Kd(a,me)){return false}_d(a,a.i+me.length);return true}
function kc(a,b,c){var d,e,f;d=new vo('\\d+');e=new to(d,c);e.e=ck(e.c,e.b);if(e.e){f=xl(e.e[0],$o,_o);a.e=cl(f);return b+f.length-1}a.e=1;return b}
function Fb(a,b,c,d){var e,f,g,h;e=ul(c.b.b,gp,b);g=Al(c.b.b,b,e);h=new to(Ab,g);h.e=ck(h.c,h.b);if(h.e){f=cl(xl(h.e[1],$o,_o));if(f!=a.b){d.f=false;Db(a,f,d)}}}
function pn(a,b){var c,d;for(c=0,d=a.b.length;c<d;++c){if(b==null?(sn(c,a.b.length),a.b[c])==null:rg(b,(sn(c,a.b.length),a.b[c]))){return c}}return -1}
function Bc(a,b,c){var d,e,f,g,h;for(g=0,h=c.length;g<h;++g){f=c[g];e=f.length;if(b+e<a.c.b.b.length){d=gm(a.c,b+1,b+e+1);if(rl(d,f)){return true}}}return false}
function Ld(a,b,c){var d,e,f,g;d=b.length;g=c-b.length+1;for(f=a.i;f<g;f++){for(e=0;e<d;e++){if(b[e]!=a.f[f+e]){break}}if(e==d){a.i=f;return true}}return false}
function Tj(){switch(Rj){case 4:case 9:return new xk;case 1:case 6:return new lk;case 3:case 8:return new tk;case 2:case 7:return new pk;}return new hk}
function Cl(c){if(c.length==0||c[0]>$p&&c[c.length-1]>$p){return c}var a=c.replace(/^([\u0000-\u0020]*)/,Zo);var b=a.replace(/[\u0000-\u0020]*$/,Zo);return b}
function vc(a,b){var c,d,e,f;d=b;c=false;e=b;while(!c){if(e<a.c.b.b.length&&(bm(a.c,e)!=60||(f=Nh(Nj,Jo,1,['/p>']),!Bc(a,e,f)))){++e;d=e}else{c=true}}return d}
function ec(){ec=Fo;cc=new vo('^m{0,4}(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$');dc=new vo('^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$')}
function Lh(a,b){var c=new Array(b);if(a==3){for(var d=0;d<b;++d){c[d]={l:0,m:0,h:0}}}else if(a>0&&a<3){var e=a==1?0:false;for(var d=0;d<b;++d){c[d]=e}}return c}
function Uk(a,b){var c;b.d=a;if(a==2){c=String.prototype}else{if(a>0){var d=Sk(b);if(d){c=d.prototype}else{d=Zj[a]=function(){};d.cZ=b;return}}else{return}}c.cZ=b}
function Jl(a){var b,c;if(a>=65536){b=55296+(~~(a-65536)>>10&1023)&65535;c=56320+(a-65536&1023)&65535;return Il(b)+Il(c)}else{return String.fromCharCode(a&65535)}}
function Ao(a){var b,c,d,e,f;f=yl(a,'\\.',0);e=$wnd;b=0;for(c=f.length-1;b<c;b++){if(!ql(f[b],'client')){e[f[b]]||(e[f[b]]={});e=Co(e,f[b])}}d=Co(e,f[b]);return d}
function Rb(){Rb=Fo;Pb=new wo('mso\\-list:.*?([;"\'])',32);Ob=new wo('style=["\'].*?mso\\-list:.*?level([0-9]+).*?["\']',32);Qb=new vo('<ul([^>]*)><li><ul([^>]*)>')}
function ob(a,b){var c,d,e,f,g,h;e=b;f=b-18>-1;d=false;g=0;while(f){c=bm(a.b,e);c==34&&g!=92&&(d=!d);(h=c==59&&!d,e==a.b.b.b.length-1||h)&&(f=false);++e;g=c}return e}
function se(){se=Fo;re=new ed(Nh(Nj,Jo,1,['font','span','b',np,'u','sub','sup','em','strong','samp','acronym','cite','code','dfn','kbd','tt','s','ins','del','var']))}
function il(){il=Fo;hl=Nh(Jj,Lo,-1,[48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122])}
function Fe(){Fe=Fo;De=Bl('<link');Ee=Bl('rel=');Be=Nh(Pj,No,2,[Bl(zp),Bl(Ap),Bl(Bp),Bl(Cp),Bl(Dp)]);Ce=Nh(Pj,No,2,[Bl(zp),Bl(Ap),Bl(Bp),Bl(Cp),Bl(Dp),Bl('stylesheet')])}
function dl(a){var b,c,d;b=Mh(Jj,Lo,-1,8,1);c=(il(),hl);d=7;if(a>=0){while(a>15){b[d--]=c[a&15];a>>=4}}else{while(d>0){b[d--]=c[a&15];a>>=4}}b[d]=c[a&15];return Gl(b,d,8)}
function Gc(a,b){var c;c=dm(a.c,b);c>-1&&(zc(a,c,'mso-list:none')||zc(a,c,'mso-list:\nnone')||zc(a,c,'mso-list:Ignore')||zc(a,c,'mso-list:skip'))?Gc(a,c+13):_b(a.i,c);Ec(a)}
function df(a,b){var c,d;if(!Wd(a,bf)){return false}if(!Kd(a,af)){return false}c=a.i+af.length;if(!Kd(a,_e)){return false}d=a.i;Xf(b,a.f,c,d-c);_d(a,a.i+_e.length);return true}
function de(a,b,c){if(!Wd(b,a.b)){return false}if(!Sd(b,b.h)){return false}if(!Ud(b,b.h-1)){return false}b.i=b.h+a.b.length-1;if(!Qd(b)){return false}Yf(c);b.h=b.i=b.b;return true}
function Ge(a,b){if(!Wd(b,De)){return false}$d(b,b.h+De.length);if(!Rd(b)){return false}if(!Ld(b,Ee,b.l)){return false}if(!Qd(b)){return false}if(!Xd(b,b.e,a.b)){return false}_d(b,b.l+1);return true}
function _c(a,b){$c();var c,d,e,f,g;c=new be(a);e=new Zf(a.length);g=b==1?Zc:Yc;d=g.length-1;for(f=0;f<d;f++){ad(c,e,g[f]);bd(c,e)}while(ad(c,e,g[d])){bd(c,e)}return Ll(e.b,e.c)}
function kg(a){var b;if(a.d==null){b=a.c===ig?null:a.c;a.e=b==null?Gp:Zh(b)?ng(Xh(b)):Yh(b,1)?Hp:sg(b).e;a.b=a.b+Fp+(Zh(b)?mg(Xh(b)):b+Zo);a.d=ip+a.e+') '+(Zh(b)?Vg(Xh(b)):Zo)+a.b}}
function Zg(b){var c=Zo;try{for(var d in b){if(d!='name'&&d!='message'&&d!='toString'){try{var e=d!='__gwt$exception'?b[d]:'<skipped>';c+='\n '+d+Fp+e}catch(a){}}}}catch(a){}return c}
function bk(a){return $stats({moduleName:$moduleName,sessionId:$sessionId,subSystem:'startup',evtGroup:'moduleStartup',millis:(new Date).getTime(),type:'onModuleLoadStart',className:a})}
function Yb(a){var b,c,d;c=new to(Qb,a);c.e=ck(c.c,c.b);if(c.e){b=xl(c.e[1],$o,_o);d=xl(c.e[2],$o,_o);return xl(dk(c.c,c.b,lp+b+"><li style='list-style: none;'><ul"+d+gp),$o,_o)}return a}
function hc(a,b){var c,d,e,f,g;f=Nh(Jj,Lo,-1,[105,118,120,99,100,108,109]);for(d=0,e=f.length;d<e;++d){c=f[d];if(g=c-1&65535,b==c&&a.b==g||pc(a,Lk(c),Lk(g),Lk(b))){return true}}return false}
function Ug(a){var b,c,d;d=Zo;a=Cl(a);b=a.indexOf(ip);c=a.indexOf('function')==0?8:0;if(b==-1){b=tl(a,Jl(64));c=a.indexOf('function ')==0?9:0}b!=-1&&(d=Cl(Al(a,c,b)));return d.length>0?d:Ip}
function Tg(b,c){var d,e,f,g;for(e=0,f=b.length;e<f;e++){g=b[e];try{g[1]?g[0].X()&&(c=Sg(c,g)):g[0].X()}catch(a){a=Xj(a);if(Yh(a,17)){d=a;Ig(Yh(d,7)?Wh(d,7).v():d)}else throw Wj(a)}}return c}
function jf(a){var b,c;if((a.i>=a.k?0:a.f[a.i])!=64){return false}b=a.h;a.i+=1;c=a.f[b+1];if(!Ik(c)&&c!=95){return false}if(!Id(a,123)){return false}if(!Id(a,125)){return false}_d(a,a.i+1);return true}
function ie(a,b){var c,d;c=a.f;d=a.h;if(c[d+1]!=58){return false}if(!Rc(fe,c[d])){return false}if(!Rc(ge,c[d-1])){return false}if(!Rd(a)){return false}if(!Qd(a)){return false}_d(a,a.b);Yf(b);return true}
function Ql(a){var b,c,d,e;b=0;d=a.length;e=d-4;c=0;while(c<e){b=a.charCodeAt(c+3)+31*(a.charCodeAt(c+2)+31*(a.charCodeAt(c+1)+31*(a.charCodeAt(c)+31*b)))|0;c+=4}while(c<d){b=b*31+pl(a,c++)}return b|0}
function Lm(j,a,b,c){var d=j.b[c];if(d){for(var e=0,f=d.length;e<f;++e){var g=d[e];var h=g.S();if(j.P(a,h)){var i=g.T();g.U(b);return i}}}else{d=j.b[c]=[]}var g=new io(a,b);d.push(g);++j.e;return null}
function Oh(a,b,c){if(c!=null){if(a.qI>0&&!Vh(c,a.qI)){throw new Ek}else if(a.qI==-1&&(c.tM==Fo||Uh(c,1))){throw new Ek}else if(a.qI<-1&&!(c.tM!=Fo&&!Uh(c,1))&&!Vh(c,-a.qI)){throw new Ek}}return a[b]=c}
function $j(a,b,c){var d=Zj[a];if(d&&!d.cZ){_=d.prototype}else{!d&&(d=Zj[a]=function(){});_=d.prototype=b<0?{}:_j(b);_.cM=c}for(var e=3;e<arguments.length;++e){arguments[e].prototype=_}if(d.cZ){_.cZ=d.cZ;d.cZ=null}}
function jb(a){var b,c,d,e;c=new vo('(class=)([^>\\s]*)');b=new to(c,a);e=new Wl;while(b.e=ck(b.c,b.b),!!b.e){d=xl(b.e[2],$o,_o);d=d.toLowerCase();qo(b,e,xl(b.e[1],$o,_o)+d)}Vl(e,xl(zl(b.b,b.d),$o,_o));return e.b.b}
function Rd(a){for(a.m=a.i;a.m>=0;a.m--){if(a.f[a.m]==62){return false}if(a.f[a.m]==60){break}}if(a.m<0){return false}for(a.l=a.i;a.l<a.k;a.l++){if(a.f[a.l]==60){return false}if(a.f[a.l]==62){return true}}return false}
function uc(a,b){var c,d;c=false;d=b;while(!c){if(zc(a,d,qp)||zc(a,d,rp)){d=wc(a,d);a.f=true}else !a.f&&rl(gm(a.c,d,d+5),ap)||d+5<a.c.b.b.length&&rl(gm(a.c,d,d+6),sp)?(d=xc(a,d)):Ac(a,d)?++d:(c=true)}a.f=false;return d}
function Oe(a){var b,c;if(!Wd(a,Je)){return false}if(!Id(a,62)){return false}b=a.i;$d(a,a.h+Je.length);if(!Ld(a,Ke,b)){return false}c=a.i+Ke.length;a.f[c]==34&&++c;if(Vd(a,c,Me)||Vd(a,c,Ie)||Vd(a,c,Le)){a.h=a.i=b+1;return true}return false}
function zd(a,b,c){var d,e,f,g;e=c;a.i=b;if(!Jd(a,46,c)){return}do{a.i+=1}while(Jd(a,46,c));d=a.i;Pd(a,wd,c)&&(e=a.i);if(e==d){return}f=a.j;g=f.length;a.j=Mh(Pj,No,2,g+1,0);g!=0&&nm(f,0,a.j,0,g);a.j[g]=Mh(Jj,Lo,-1,e-d,1);nm(a.f,d,a.j[g],0,e-d)}
function kb(b,c,d){var e,f,g;try{g=b?($c(),Xc):1;e=_c(d,g);e=lb(e);b&&!c&&(e=jb(e));return I(),I(),new Q(new T(e),H)}catch(a){a=Xj(a);if(Yh(a,13)){f=a;return I(),M(Zo,new Sn(Nh(Nj,Jo,1,['Failed to clean MS Office HTML.\n'+f.u()])))}else throw Wj(a)}}
function sc(a){var b,c,d,e;b=(a.j=$b(a.i,a.c),a.o==-1&&(a.o=a.j),c=Hc(a),ro(new to(new vo('[0-9]\\.[0-9]'),yc(a,c)))?(a.l=false):Fb(a.h,a.j,a.c,a.k),d=(e=Cc(c+1,bm(a.c,c+1)),uc(a,e)),a.d=vc(a,d),gm(a.c,d,a.d));if(a.k.f){Hb(a.h);Mb(a.h,a.k)}Eb(a.h,b,a.k)}
function jc(a,b,c){var d,e;d=lc(a,c,b,cc);if(d>0){return a.c=np,nc(a,b,c,d)}e=lc(a,c,b,dc);if(e>0){return a.c='I',nc(a,b,c,e)}if(Jk(pl(b.b.b,c))){fc(a,b,c,'a');return c}if(Ik(pl(b.b.b,c))){fc(a,b,c,'A');return c}else{return a.c=Zo,a.b=0,kc(a,c,zl(b.b.b,c))}}
function Gd(a,b){var c,d,e,f,g;if(!Wd(a,Cd)){return false}g=a.i;if(!Kd(a,Bd)){return false}c=a.i+Bd.length;d=b.c;Xf(b,Cd,0,Cd.length);e=a.k;Zd(a,a.f,a.i);_d(a,g+Cd.length);f=Fd(a,b);Zd(a,a.f,e);if(f){Xf(b,Bd,0,Bd.length);a.h=a.i=c}else{b.c=d;a.h=a.i=g}return f}
function ed(a){var b,c,d,e,f,g,h;this.b=Mh(Qj,Jo,3,128,0);for(c=0,d=a.length;c<d;++c){b=a[c];g=Bl(b);e=g[0];e>=128&&(e=0);if(this.b[e]==null){this.b[e]=Nh(Pj,No,2,[g])}else{h=this.b[e];f=h.length;this.b[e]=Mh(Pj,No,2,f+1,0);nm(h,0,this.b[e],0,f);this.b[e][f]=g}}}
function tb(a,b){var c,d,e,f,g,h;d='Content before importing MS-Word lists:\r\n'+a;f=Ub(a,b);c='Content after importing MS-Word lists:\r\n'+f;e=(g=new vo('\xB7'),h=new to(g,f),h.e=ck(h.c,h.b),h.e?xl(dk(h.c,h.b,'&#8226;'),$o,_o):f);return M(e,new Sn(Nh(Nj,Jo,1,[d,c])))}
function Vc(a,b){var c,d,e,f;if(!Wc(a,Tc)){return false}d=a.i;c=a.h+Tc.length;a.i=c;a.h=a.i=c;e=Bl('<img ');Xf(b,e,0,e.length);f=Bl('o:title="');if(!Ld(a,f,d)){return true}Xf(b,a.f,c,a.i-c);$d(a,a.i+f.length);if(!Jd(a,34,d)){return true}$d(a,a.i+1);_d(a,a.i);return true}
function le(a,b){var c,d;if(a.j.length==0){return false}if(!Wd(a,je)){return false}if(!Rd(a)){return false}if(!Qd(a)){return false}c=a.d-a.e;for(d=0;d<a.j.length;d++){if(a.j[d].length==c){if(Vd(a,a.e,a.j[d])){break}}}if(d==a.j.length){return false}_d(a,a.b);Yf(b);return true}
function Tb(a){var b,c,d,e,f,g;d=new vo('<span[^>]*font-family:Symbol[^>]*>\xB7<span');e=new vo('font-family:Symbol');b=new to(d,a);g=new Wl;while(b.e=ck(b.c,b.b),!!b.e){c=new to(e,xl(b.e[0],$o,_o));f=xl(dk(c.c,c.b,Zo),$o,_o);qo(b,g,f)}Vl(g,xl(zl(b.b,b.d),$o,_o));return g.b.b}
function Fd(a,b){var c,d,e,f;d=false;f=32;c=a.i>=a.k?0:a.f[a.i];while(c!=0){e=false;switch(c){case 64:e=jf(a);break;case 47:e=We(a);}!e&&(f==10||f==13)&&(e=yd(Dd,a,b));if(e){d=true;f=b.c==0?0:b.b[b.c-1];a.i=a.h;c=a.i>=a.k?0:a.f[a.i]}else{Wf(b,f=c);c=(a.i=++a.h)>=a.k?0:a.f[a.i]}}return d}
function ph(a,b){var c,d,e,f,g,h,i,j,k,l;l=Mh(Mj,Jo,16,b.length,0);for(f=0,g=l.length;f<g;f++){k=yl(b[f],Kp,0);i=-1;c=-1;e=Lp;if(k.length==2&&k[1]!=null){j=k[1];h=vl(j,Jl(58));d=wl(j,Jl(58),h-1);e=Al(j,0,d);if(h!=-1&&d!=-1){i=Wg(Al(j,d+1,h));c=Wg(zl(j,h+1))}}l[f]=new ml(k[0],e+Yo+c,a.G(i<0?-1:i))}dg(l)}
function Dc(a){var b,c,d,e,f,g,h,i,j;c=$b(a.i,a.c);d=gm(a.c,a.d,c);e=new to(a.b,d);e.e=ck(e.c,e.b);!!e.e&&(h=a.d+4,cm(a.c,h,c),i=a.i.b,j=c-h,_b(a.i,i-j),undefined);b=$b(a.i,a.c);if(f=gm(a.c,a.d,b),g=new to(a.e,f),g.e=ck(g.c,g.b),!g.e){a.n=a.d+4;Fb(a.h,b,a.c,a.k);Fc(a);a.l=true;Lb(a.h);mc(a.k)}else{a.n=a.d+4}}
function cl(a){var b,c,d,e,f;if(a==null){throw new kl(Gp)}d=a.length;e=d>0&&(a.charCodeAt(0)==45||a.charCodeAt(0)==43)?1:0;for(b=e;b<d;b++){if(Gk(a.charCodeAt(b))==-1){throw new kl(Zp+a+tp)}}f=parseInt(a,10);c=f<-2147483648;if(isNaN(f)){throw new kl(Zp+a+tp)}else if(c||f>2147483647){throw new kl(Zp+a+tp)}return f}
function jd(){jd=Fo;hd=new ed(Nh(Nj,Jo,1,['font-color','horiz-align','language','list-image-','mso-','page:','separator-image','tab-stops','tab-interval','text-underline','text-effect','text-line-through','table-border-color-dark','table-border-color-light','vert-align','vnd.ms-excel.']));gd=new ed(Nh(Nj,Jo,1,[jp]))}
function ze(a,b){var c,d,e,f;if(!Wd(a,xe)){return false}f=a.h+xe.length;for(;f<a.k;f++){c=a.f[f];if(c==62){break}if(c!=32&&c!=10&&c!=9&&c!=13){return false}}e=a.i=f+1;if(!Kd(a,we)){return false}d=a.i;a.i=e;if(Ld(a,xe,d)){return false}$d(a,d+we.length);if(!Id(a,62)){return false}Xf(b,a.f,e,d-e);_d(a,a.i+1);return true}
function ad(a,b,c){var d,e,f,g,h,i,j;j=a.k;e=a.f;a.h=a.i=0;f=32;d=c.s();h=0;i=0;g=false;while(i<j){for(;h<j;h++){f=e[h];if(f<256&&d[f]){break}}if(h>=j){nm(e,i,b.b,b.c,j-i);b.c+=j-i;break}(f==10||f==13)&&++h;h!=i&&(nm(e,i,b.b,b.c,h-i),b.c+=h-i);if(h==j){break}a.i=a.h=h;if(c.t(a,b,f)){g=true;i=h=a.i=a.h}else{i=h;f!=10&&f!=13&&++h}}return g}
function kd(a,b,c,d,e,f,g){var h,i,j,k,l,m;l=d;m=e;k=c.c;b.i=e;i=false;j=false;while(m<f){if(!ae(b)||b.i>=f){break}h=a.r(b);if(h){i=true;m!=l&&Xf(c,b.f,l,m-l);if(Jd(b,59,f)){l=m=b.i+=1}else{l=f;break}}else{j=true;if(Jd(b,59,f)){m=b.i+=1}else{break}}}if(j&&!i){return false}if(j&&i){g!=l&&Xf(c,b.f,l,g-l)}else{c.c=k;Yf(c)}b.h=b.i=g;return true}
function yd(a,b,c){var d,e,f,g,h,i,j,k,l;i=b.i;if(b.f[b.i+-1]!=10&&b.f[b.i+-1]!=13){return false}d=b.i>=b.k?0:b.f[b.i];if(d==123||d==125){return false}f=b.i;if(!Od(b,vd)){return false}e=b.i;if((b.i>=b.k?0:b.f[b.i])!=123){if(!ae(b)){return false}if((b.i>=b.k?0:b.f[b.i])!=123){return false}}l=b.i+1;if(!Id(b,125)){return false}j=b.i;k=j+1;g=c.c;h=kd(a,b,c,i,l,j,k);h&&c.c<=g&&zd(b,f,e);return h}
function te(a){var b,c,d,e,f,g;d=a.h+1;b=a.f[d];if(b>127){return false}g=re.b[b];if(g==null){return false}f=ue(a.f,d);for(c=0;c<g.length;c++){if(Vd(a,d,g[c])&&f==g[c].length){break}}if(c==g.length){return false}e=g[c];a.i=d+e.length;if(!Id(a,62)){return false}d=a.i+1;if(a.f[d++]!=60||a.f[d++]!=47){return false}if(!Vd(a,d,e)){return false}a.i=d+e.length;if(!Id(a,62)){return false}_d(a,a.i+1);return true}
function hf(a,b){var c,d,e,f,g,h;f=a.h;if(a.f[f+2]!=58||a.f[f]!=60){return false}if(!Rc(ff,a.f[f+1])){return false}h=f+1;a.i=f+3;if(!Nd(a,ef)){return false}g=a.i-h;if(!Id(a,62)){return false}if(Td(a,a.i-1)==47){_d(a,a.i+1);return true}e=a.i+1;while(Md(a,a.f,h,g)){d=a.i-1;c=a.f[d];if(c==60){return false}if(c==47&&Td(a,--d)==60){if(!Id(a,62)){return false}Xf(b,a.f,e,d-e);_d(a,a.i+1);return true}++a.i}return false}
function lc(a,b,c,d){var e,f,g,h,i,j,k;e=(i=ul(c.b.b,op,b),j=ul(c.b.b,pp,b),k=ul(c.b.b,'<',b),i>0&&i<k?i:j<k?j:-1);if(e>0){h=Al(c.b.b,b,e);if(h.length==1&&ic(a,h.charCodeAt(0))){return -1}if(h.indexOf(qp)==-1){g=new to(d,h);f=(g.e=ck(g.c,g.b),!!g.e);if(f&&(!g.e||g.e.length<1?-1:g.e.index)!=(!g.e||g.e.length<1?-1:g.e.index+g.e[0].length)){return (!g.e||g.e.length<1?-1:g.e.index+g.e[0].length)-(!g.e||g.e.length<1?-1:g.e.index)}}}return -1}
function Wb(a,b,c,d){var e,f,g,h,i,j,k;f=new to(new wo(ip+b+'\\s*){2,}',32),a);i=new Wl;while(f.e=ck(f.c,f.b),!!f.e){h=new vo(b);e=xl(f.e[0],$o,_o);if(e.indexOf(jp)==-1){continue}g=new to(h,e);j=new Wl;g.e=ck(g.c,g.b);if(g.e){k=xl(g.e[1],$o,_o);k=d.q(k);qo(g,j,hp+k+kp+xl(g.e[c],$o,_o)+fp)}while(g.e=ck(g.c,g.b),!!g.e){qo(g,j,ep+xl(g.e[c],$o,_o)+fp)}Ch(j.b,dp);Vl(j,xl(zl(g.b,g.d),$o,_o));qo(f,i,j.b.b)}Vl(i,xl(zl(f.b,f.d),$o,_o));return i.b.b}
function yl(l,a,b){var c=new RegExp(a,Yp);var d=[];var e=0;var f=l;var g=null;while(true){var h=c.exec(f);if(h==null||f==Zo||e==b-1&&b>0){d[e]=f;break}else{d[e]=f.substring(0,h.index);f=f.substring(h.index+h[0].length,f.length);c.lastIndex=0;if(g==f){d[e]=f.substring(0,1);f=f.substring(1)}g=f;e++}}if(b==0&&l.length>0){var i=d.length;while(i>0&&d[i-1]==Zo){--i}i<d.length&&d.splice(i,d.length-i)}var j=El(d.length);for(var k=0;k<d.length;++k){j[k]=d[k]}return j}
function Qd(a){var b,c;for(b=a.i;b<a.k;b++){if(a.f[b]==62){return false}if(a.f[b]==61){break}}if(b==a.k){return false}a.c=++b;c=a.f[b];if(c==34||c==39){a.e=++b;for(;b<a.k;b++){if(a.f[b]==62){return false}if(a.f[b]==c){break}}if(b==a.k){return false}a.d=b;a.b=b+1;a.i=a.e;return true}else{a.e=a.c;for(;b<a.k;b++){if(a.f[b]==62){break}if(a.f[b]==32){break}if(a.f[b]==9){break}if(a.f[b]==13){break}if(a.f[b]==10){break}}if(b==a.k){return false}a.d=a.b=b;return true}}
function gb(b){var c,d,e,f,g,h,i;d=0;c=new Xl(b.toLowerCase());e=false;try{d=(f=(g=0,g+=cb(c,109,1000),g+=fb(c,99,109,900),g+=eb(c,100,500),g+=fb(c,99,100,400),g),f=(h=f,h+=cb(c,99,100),h+=fb(c,120,99,90),h+=eb(c,108,50),h+=fb(c,120,108,40),h),f=(i=f,i+=cb(c,120,10),i+=fb(c,105,120,9),i+=eb(c,118,5),i+=fb(c,105,118,4),i),f+=cb(c,105,1),f)}catch(a){a=Xj(a);if(Yh(a,14)){e=true}else throw Wj(a)}if(e||c.b.b.length>0){throw new $k(b+' is not a parsable roman numeral')}return d}
function Uj(){var a,b,c;ak()&&bk('com.google.gwt.useragent.client.UserAgentAsserter');a=Wh(Tj(),9);b=a.H();c=a.I();ql(b,c)||($wnd.alert('ERROR: Possible problem with your *.gwt.xml module file.\nThe compile time user.agent value ('+b+') does not match the runtime user.agent value ('+c+'). Expect more errors.\n'),undefined);ak()&&bk('com.google.gwt.user.client.DocumentModeAsserter');fk();ak()&&bk('com.ephox.keurig.client.Keurig');Eo();new ab;$wnd.gwtInited&&$wnd.gwtInited()}
function lb(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,q;d=new jm(a);b=d.b.b.length;while(b>-1){b=wl(d.b.b,'<p',b);c=ul(d.b.b,'<\/p>',b);if(b>-1&&c>-1){q=Al(d.b.b,b,c);m=q.indexOf(ap);if(m>-1){l=tl(q,Jl(62));if(l+1==m){f=ul(q,Jl(62),m);n=Al(q,m,f+1);e=n.indexOf(bp);if(e>-1){h=q.lastIndexOf('<\/span>');if(7+h==q.length){i=Al(q,0,tl(q,Jl(62))+1);k=i.indexOf(bp);if(k>-1){j=ib(q,k);o=ib(n,e);if(!ql(j,o)){g=q.length-7;em(d,g+b,q.length+b,Zo);em(d,m+b,m+n.length+b,Zo);em(d,k+b,k+j.length+b,o)}}}}}}}--b}return d.b.b}
function nm(a,b,c,d,e){var f,g,h,i,j,k,l,m,n;if(a==null||c==null){throw new gl}m=sg(a);i=sg(c);if((m.c&4)==0||(i.c&4)==0){throw new Fk('Must be array types')}l=m.b;g=i.b;if(!((l.c&1)!=0?l==g:(g.c&1)==0)){throw new Fk('Array types must match')}n=a.length;j=c.length;if(b<0||d<0||e<0||b+e>n||d+e>j){throw new al}if(((l.c&1)==0||(l.c&4)!=0)&&m!=i){k=Wh(a,15);f=Wh(c,15);if(_h(a)===_h(c)&&b<d){b+=e;for(h=d+e;h-->d;){Oh(f,h,k[--b])}}else{for(h=d+e;d<h;){Oh(f,d++,k[b++])}}}else{Array.prototype.splice.apply(c,[d,e].concat(a.slice(b,b+e)))}}
function Xb(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o,q,r,s;j=new to(new wo(ip+b+'\\s*)+',32),a);o=new Wl;while(j.e=ck(j.c,j.b),!!j.e){m=new wo(b,32);k=new to(m,xl(j.e[0],$o,_o));q=new Wl;e=0;d=1;while(k.e=ck(k.c,k.b),!!k.e){n=xl(k.e[1],$o,_o);i=new to(Ob,n);i.e=ck(i.c,i.b);if(i.e){c=(r=xl(k.e[4],$o,_o),ql(r,'\xA7')?' type="square"':ql(r,'o')?' type="circle"':Zo);l=(s=new to(Ob,n),s.e=ck(s.c,s.b),s.e?cl(xl(s.e[1],$o,_o)):d);h=l>e?C(lp+c+kp,l-e):C(mp,e-l)+'<\/li><li>';f=xl(k.e[7],$o,_o);f=f;f=f;qo(k,q,h+f);e=l;d=l}}Vl(q,C(mp,e));Vl(q,xl(zl(k.b,k.d),$o,_o));g=q.b.b;g=Yb(g);g=g;g=g;qo(j,o,g)}Vl(o,xl(zl(j.b,j.d),$o,_o));return o.b.b}
function Ub(a,b){var c,d,e,f;c=(e=new to(new wo('<\/?u[0-9]:p>',33),a),xl(dk(e.c,e.b,Zo),$o,_o));c=Xb(c,'<p([^>]*)>(<[^>]*>)*?(<span[^>]*?>){1,3}([\xB7\xA7\u2022o-]|\xD8|&middot;|<img[^>]*>)(&nbsp;)*\\s*<span[^>]*>.*?(<\/span>){2,3}(.*?)<\/p>');c=Xb(c,'<p([^>]*)>(<[^>]*>)*?(<span[^>]*?>){1,3}([\xB7\xA7\u2022o-]|\xD8|&middot;|<img[^>]*>)(&nbsp;)*\\s*(<\/span[^>]*>){1,3}(.*?)<\/p>');c=Vb(c,'<p[^>]*>(\\d+)\\.(&nbsp;)+(.*?)<\/p>',3);c=Vb(c,'<p[^>]*>(\\d+)((\\.)|(\\)))\\s*\u0160*(.*?)<\/p>',5);c=Sb(c,'<p[^>]*>([a-zA-Z])\\.(&nbsp;)+(.*?)<\/p>',3);c=Sb(c,'<p[^>]*>([a-zA-Z])((\\.)|(\\)))\\s*\u0160*(.*?)<\/p>',5);d=new Jc;c=(d.n=0,d.k=new qc,d.h=new Nb,d.i=new ac,d.c=new jm(c),Ic(d));b&&(c=Tb(c));c=so(new to(Pb,c));c=(f=new to(new wo('style *?=[\'"](;?)[\'"]',32),c),xl(dk(f.c,f.b,Zo),$o,_o));return c}
function fk(){var a,b,c;b=$doc.compatMode;a=Nh(Nj,Jo,1,[Op]);for(c=0;c<a.length;c++){if(ql(a[c],b)){return}}a.length==1&&ql(Op,a[0])&&ql('BackCompat',b)?"GWT no longer supports Quirks Mode (document.compatMode=' BackCompat').<br>Make sure your application's host HTML page has a Standards Mode (document.compatMode=' CSS1Compat') doctype,<br>e.g. by using &lt;!doctype html&gt; at the start of your application's HTML page.<br><br>To continue using this unsupported rendering mode and risk layout problems, suppress this message by adding<br>the following line to your*.gwt.xml module file:<br>&nbsp;&nbsp;&lt;extend-configuration-property name=\"document.compatMode\" value=\""+b+'"/&gt;':"Your *.gwt.xml module configuration prohibits the use of the current doucment rendering mode (document.compatMode=' "+b+"').<br>Modify your application's host HTML page doctype, or update your custom 'document.compatMode' configuration property settings."}
function $(h){var e=(Eo(),Ao('com.ephox.keurig.WordCleaner'));var f,g=h;$wnd.com.ephox.keurig.WordCleaner=Xo(function(){var a,b=this,c=arguments;c.length==1&&g.p(c[0])?(a=c[0]):c.length==0&&(a=new W);b.g=a;a['__gwtex_wrap']=b;return b});f=$wnd.com.ephox.keurig.WordCleaner.prototype=new Object;$wnd.com.ephox.keurig.WordCleaner.cleanDocument=Xo(function(a,b){var c,d;return c=new vb(a,b),d=ub(c.c,c.d,c.b),Wh(d.c.b,1)});$wnd.com.ephox.keurig.WordCleaner.failingTest=Xo(function(){return Ub((Rb(),"<p class=msolistparagraphcxspfirst style='text-indent:-18.0pt;mso-list:l0 level1 lfo1'><span style='font-family:Symbol;'><span style='mso-list:Ignore'>\xB7<span style='font:7.0pt \"Times New Roman\"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\n<\/span><\/span><\/span>One<\/p>\n<p class=msolistparagraphcxspmiddle style='text-indent:-18.0pt;mso-list:l0 level1 lfo1'><span style='font-family:Symbol;'><span style='mso-list:Ignore'>\xB7<span style='font:7.0pt \"Times New Roman\"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\n<\/span><\/span><\/span>Two<\/p>\n<p class=msolistparagraphcxsplast style='text-indent:-18.0pt;mso-list:l0 level1 lfo1'><span style='font-family:Symbol;'><span style='mso-list:Ignore'>\xB7<span style='font:7.0pt \"Times New Roman\"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\n<\/span><\/span><\/span>Three<\/p>"),true)});$wnd.com.ephox.keurig.WordCleaner.yury=Xo(function(a,b){var c;return c=b?($c(),Xc):1,_c(a,c)});if(e)for(p in e)$wnd.com.ephox.keurig.WordCleaner[p]===undefined&&($wnd.com.ephox.keurig.WordCleaner[p]=e[p])}
var Zo='',$p=' ',tp='"',rp='&#160;',qp='&nbsp;',cp="'",ip='(',op=')',_p=', ',pp='.',Jp=':',Fp=': ',fp='<\/li>',mp='<\/li><\/ul>',dp='<\/ol>',sp='<\/span',vp='<\/style>',ep='<li>',hp='<ol',ap='<span',up='<style',lp='<ul',wp='=',gp='>',kp='><li>',Yo='@',Kp='@@',Op='CSS1Compat',Ap='Edit-Time-Data',zp='File-List',Zp='For input string: "',Bp='Ole-Object-Data',Cp='Original-File',Dp='Preview',Hp='String',Lp='Unknown',Mp='[',cq='[Ljava.lang.',$o='\\uE000',Np=']',yp=']>',Ip='anonymous',jq='com.ephox.functional.data.immutable.',hq='com.ephox.keurig.client.',iq='com.ephox.tord.guts.',lq='com.ephox.tord.lists.',nq='com.ephox.tord.lists.listattributehandlers.',kq='com.ephox.tord.wordhtmlfilter.',bq='com.google.gwt.core.client.',eq='com.google.gwt.core.client.impl.',dq='com.google.gwt.useragent.client.',bp='dir=',Yp='g',Wp='gecko',Pp='gecko1_8',np='i',Tp='ie10',Vp='ie8',Up='ie9',aq='java.lang.',gq='java.util.',mq='java.util.regex.',Ep='lang',Sp='msie',jp='mso-list',Gp='null',fq='org.timepedia.exporter.client.',xp='ovwxp',Rp='safari',Xp='unknown',Qp='webkit',_o='\xA0';var _,Zj={},Lo={2:1,10:1},Ro={10:1,13:1,14:1,17:1},Ko={4:1},Oo={6:1},Vo={20:1},No={3:1,10:1,15:1},Io={},Wo={10:1,18:1},To={19:1},Jo={10:1,15:1},Po={10:1,13:1,17:1},Qo={9:1},Uo={21:1},Mo={10:1},So={11:1};$j(1,-1,Io,u);_.eQ=function v(a){return this===a};_.gC=function w(){return this.cZ};_.hC=function A(){return Gg(this)};_.tS=function B(){return this.cZ.e+Yo+dl(this.hC())};_.toString=function(){return this.tS()};_.tM=Fo;$j(4,1,{});$j(5,1,Ko);_.eQ=function K(a){return Yh(a,4)&&O(this,Wh(a,4))};_.hC=function L(){return 42};_.tS=function N(){return 'value: '+this.c.b+', log: '+Wh(this.b.b,18)};var G,H;$j(8,5,Ko,Q);$j(10,4,{},T);$j(13,1,{5:1},W);$j(14,1,{},ab);_.p=function bb(a){return a!=null&&Yh(a,5)};var Y=false;$j(16,1,{});_.c=false;_.d=false;$j(17,1,{},qb);$j(18,16,{},vb);$j(19,1,{},yb);_.b=false;$j(20,1,{},Nb);_.b=0;_.c=false;var Ab;var Ob,Pb,Qb;$j(22,1,{},ac);_.b=0;$j(23,1,{},qc);_.b=0;_.e=0;_.f=false;var cc,dc;$j(24,1,{},Jc);_.d=0;_.f=false;_.j=0;_.l=true;_.m=0;_.n=0;_.o=-1;$j(25,1,{},Lc);_.q=function Mc(a){return a!=null&&Kk(a.charCodeAt(0))?' type="A"':' type="a"'};$j(26,1,{},Oc);_.q=function Pc(a){return a==null||ql(a,'1')?Zo:' start="'+a+tp};$j(27,1,{},Sc);var Tc;var Xc=0,Yc,Zc;$j(30,1,{},ed);$j(31,1,{});_.r=function ld(a){var b,c,d;c=a.i>=a.k?0:a.f[a.i];d=dd(gd,c);if(d!=null&&Xd(a,a.i,d)){return false}b=dd(hd,c);return b!=null&&Xd(a,a.i,b)};var gd,hd;$j(32,31,{},qd);var nd;$j(33,32,{},td);_.r=function sd(a){var b,c;b=a.i>=a.k?0:a.f[a.i];c=dd((jd(),gd),b);return c==null||!Xd(a,a.i,c)};$j(34,31,{},Ad);var vd,wd;var Bd,Cd,Dd;$j(36,1,{},be);_.b=0;_.c=0;_.d=0;_.e=0;_.h=0;_.i=0;_.k=0;_.l=0;_.m=0;$j(37,1,{},ee);var fe,ge;var je;var me,ne,oe;var re;var we,xe;$j(44,1,{},He);var Be,Ce,De,Ee;var Ie,Je,Ke,Le,Me;var Pe,Qe;var Te,Ue;var Xe,Ye;var _e,af,bf;var ef,ff;$j(52,1,Oo,nf);_.s=function of(){return lf.b};_.t=function pf(a,b,c){switch(c){case 60:if(te(a)){return true}a.i=a.h;if(ze(a,b)){return true}a.i=a.h;return hf(a,b);case 13:case 10:return ve(a);}return false};var lf;$j(53,1,Oo,tf);_.s=function uf(){return rf.b};_.t=function vf(a,b,c){switch(c){case 60:if(Vc(a,b)){return true}a.i=a.h;if(qe(a)){return true}a.i=a.h;if(df(a,b)){return true}a.i=a.h;return Oe(a);case 120:return Se(a,b);case 13:case 10:return ve(a);}return false};var rf;$j(54,1,Oo,zf);_.s=function Af(){return xf.b};_.t=function Bf(a,b,c){switch(c){case 60:if(te(a)){return true}a.i=a.h;if(ze(a,b)){return true}a.i=a.h;return hf(a,b);case 13:case 10:return ve(a);case 99:return le(a,b);}return false};var xf;$j(55,1,Oo,If);_.s=function Jf(){return Df.b};_.t=function Kf(a,b,c){switch(c){case 60:if(hf(a,b)){return true}a.i=a.h;if(Gd(a,b)){return true}a.i=a.h;if(Ge(Gf,a)){return true}a.i=a.h;return false;case 111:case 118:case 119:case 120:case 112:return ie(a,b);case 115:return pd(Ef,a,b);case 108:return de(Ff,a,b);}return false};var Df,Ef,Ff,Gf;$j(56,1,Oo,Sf);_.s=function Tf(){return Mf.b};_.t=function Uf(a,b,c){switch(c){case 60:if(hf(a,b)){return true}a.i=a.h;if($e(a)){return true}a.i=a.h;if(Ge(Qf,a)){return true}a.i=a.h;return false;case 115:return pd(Nf,a,b);case 99:return de(Of,a,b);case 108:return de(Pf,a,b);case 111:case 118:case 119:case 120:case 112:return ie(a,b);}return false};var Mf,Nf,Of,Pf,Qf;$j(57,1,{},Zf);_.tS=function $f(){return Ll(this.b,this.c)};_.c=0;$j(63,1,{10:1,17:1});_.u=function eg(){return this.f};_.tS=function fg(){var a,b;a=this.cZ.e;b=this.u();return b!=null?a+Fp+b:a};$j(62,63,Po);$j(61,62,Po);$j(60,61,{7:1,10:1,13:1,17:1},lg);_.u=function og(){kg(this);return this.d};_.v=function pg(){return this.c===ig?null:this.c};var ig;$j(67,1,{});var wg=0,xg=0,yg=0,zg=-1;$j(69,67,{},Rg);var Ng;$j(72,1,{},_g);_.w=function ah(){var a={};var b=[];var c=arguments.callee.caller.caller;while(c){var d=this.B(c.toString());b.push(d);var e=Jp+d;var f=a[e];if(f){var g,h;for(g=0,h=f.length;g<h;g++){if(f[g]===c){return b}}}(f||(a[e]=[])).push(c);c=c.caller}return b};_.A=function bh(a){var b,c,d,e;d=this.D(a.c===(jg(),ig)?null:a.c);e=Mh(Mj,Jo,16,d.length,0);for(b=0,c=e.length;b<c;b++){e[b]=new ml(d[b],null,-1)}dg(e)};_.B=function dh(a){return Ug(a)};_.C=function eh(a){var b,c,d,e;d=Sj().w();e=Mh(Mj,Jo,16,d.length,0);for(b=0,c=e.length;b<c;b++){e[b]=new ml(d[b],null,-1)}dg(e)};_.D=function fh(a){return []};$j(74,72,{},jh);_.w=function kh(){return Xg(this.D($g()),this.F())};_.D=function lh(a){return ih(this,a)};_.F=function mh(){return 2};$j(73,74,{});_.w=function qh(){var a;a=Xg(oh(this,$g()),3);a.length==0&&(a=Xg((new _g).w(),1));return a};_.A=function rh(a){var b;b=oh(this,a.c===(jg(),ig)?null:a.c);ph(this,b)};_.B=function sh(a){var b,c,d,e;if(a.length==0){return Ip}e=Cl(a);e.indexOf('at ')==0&&(e=zl(e,3));c=e.indexOf(Mp);c!=-1&&(e=Cl(Al(e,0,c))+Cl(zl(e,e.indexOf(Np,c)+1)));c=e.indexOf(ip);if(c==-1){c=e.indexOf(Yo);if(c==-1){d=e;e=Zo}else{d=Cl(zl(e,c+1));e=Cl(Al(e,0,c))}}else{b=e.indexOf(op,c);d=Al(e,c+1,b);e=Cl(Al(e,0,c))}c=tl(e,Jl(46));c!=-1&&(e=zl(e,c+1));return (e.length>0?e:Ip)+Kp+d};_.C=function th(a){var b;b=Sj().w();ph(this,b)};_.D=function uh(a){return oh(this,a)};_.G=function vh(a){return a};_.F=function wh(){return 3};$j(75,73,{},yh);_.G=function zh(a){return -1};$j(76,1,{});$j(77,76,{},Fh);_.b=Zo;$j(81,1,{},Hh);_.qI=0;var Ph,Qh;var Rj=-1;$j(95,1,Qo,hk);_.H=function ik(){return Pp};_.I=function jk(){var b=navigator.userAgent.toLowerCase();var c=function(a){return parseInt(a[1])*1000+parseInt(a[2])};if(function(){return b.indexOf(Qp)!=-1}())return Rp;if(function(){return b.indexOf(Sp)!=-1&&$doc.documentMode>=10}())return Tp;if(function(){return b.indexOf(Sp)!=-1&&$doc.documentMode>=9}())return Up;if(function(){return b.indexOf(Sp)!=-1&&$doc.documentMode>=8}())return Vp;if(function(){return b.indexOf(Wp)!=-1}())return Pp;return Xp};$j(96,1,Qo,lk);_.H=function mk(){return Tp};_.I=function nk(){var b=navigator.userAgent.toLowerCase();var c=function(a){return parseInt(a[1])*1000+parseInt(a[2])};if(function(){return b.indexOf(Qp)!=-1}())return Rp;if(function(){return b.indexOf(Sp)!=-1&&$doc.documentMode>=10}())return Tp;if(function(){return b.indexOf(Sp)!=-1&&$doc.documentMode>=9}())return Up;if(function(){return b.indexOf(Sp)!=-1&&$doc.documentMode>=8}())return Vp;if(function(){return b.indexOf(Wp)!=-1}())return Pp;return Xp};$j(97,1,Qo,pk);_.H=function qk(){return Vp};_.I=function rk(){var b=navigator.userAgent.toLowerCase();var c=function(a){return parseInt(a[1])*1000+parseInt(a[2])};if(function(){return b.indexOf(Qp)!=-1}())return Rp;if(function(){return b.indexOf(Sp)!=-1&&$doc.documentMode>=10}())return Tp;if(function(){return b.indexOf(Sp)!=-1&&$doc.documentMode>=9}())return Up;if(function(){return b.indexOf(Sp)!=-1&&$doc.documentMode>=8}())return Vp;if(function(){return b.indexOf(Wp)!=-1}())return Pp;return Xp};$j(98,1,Qo,tk);_.H=function uk(){return Up};_.I=function vk(){var b=navigator.userAgent.toLowerCase();var c=function(a){return parseInt(a[1])*1000+parseInt(a[2])};if(function(){return b.indexOf(Qp)!=-1}())return Rp;if(function(){return b.indexOf(Sp)!=-1&&$doc.documentMode>=10}())return Tp;if(function(){return b.indexOf(Sp)!=-1&&$doc.documentMode>=9}())return Up;if(function(){return b.indexOf(Sp)!=-1&&$doc.documentMode>=8}())return Vp;if(function(){return b.indexOf(Wp)!=-1}())return Pp;return Xp};$j(99,1,Qo,xk);_.H=function yk(){return Rp};_.I=function zk(){var b=navigator.userAgent.toLowerCase();var c=function(a){return parseInt(a[1])*1000+parseInt(a[2])};if(function(){return b.indexOf(Qp)!=-1}())return Rp;if(function(){return b.indexOf(Sp)!=-1&&$doc.documentMode>=10}())return Tp;if(function(){return b.indexOf(Sp)!=-1&&$doc.documentMode>=9}())return Up;if(function(){return b.indexOf(Sp)!=-1&&$doc.documentMode>=8}())return Vp;if(function(){return b.indexOf(Wp)!=-1}())return Pp;return Xp};$j(100,1,{});_.tS=function Ck(){return ug(this.b)};$j(101,61,Po,Ek,Fk);$j(103,1,{},Nk);_.tS=function Vk(){return ((this.c&2)!=0?'interface ':(this.c&1)!=0?Zo:'class ')+this.e};_.c=0;_.d=0;$j(104,61,Po,Xk);$j(105,61,Ro,Zk,$k);$j(106,61,Po,al,bl);$j(110,61,Po,gl);var hl;$j(112,105,Ro,kl);$j(113,1,{10:1,16:1},ml);_.tS=function nl(){return this.b+pp+this.e+ip+(this.c!=null?this.c:'Unknown Source')+(this.d>=0?Jp+this.d:Zo)+op};_.d=0;_=String.prototype;_.cM={1:1,10:1,11:1,12:1};_.eQ=function Hl(a){return ql(this,a)};_.hC=function Kl(){return Rl(this)};_.tS=_.toString;var Ml,Nl=0,Ol;$j(115,1,So,Wl,Xl);_.tS=function Yl(){return this.b.b};$j(116,1,So,hm,im,jm);_.tS=function km(){return this.b.b};$j(117,106,Po,mm);$j(119,61,Po,pm);$j(120,1,{});_.J=function sm(a){throw new pm('Add not supported on this collection')};_.K=function tm(a){var b;b=rm(this.L(),a);return !!b};_.N=function um(){return this.O(Mh(Lj,Jo,0,this.M(),0))};_.O=function vm(a){var b,c,d;d=this.M();a.length<d&&(a=Kh(a,d));c=this.L();for(b=0;b<d;++b){Oh(a,b,c.R())}a.length>d&&Oh(a,d,null);return a};_.tS=function wm(){var a,b,c,d;c=new Wl;a=null;Ch(c.b,Mp);b=this.L();while(b.Q()){a!=null?(Ch(c.b,a),c):(a=_p);d=b.R();Ch(c.b,d===this?'(this Collection)':Zo+d)}Ch(c.b,Np);return c.b.b};$j(122,1,To);_.eQ=function zm(a){var b,c,d,e,f;if(a===this){return true}if(!Yh(a,19)){return false}e=Wh(a,19);if(this.e!=e.e){return false}for(c=new Ym((new Tm(e)).b);yn(c.b);){b=Wh(zn(c.b),20);d=b.S();f=b.T();if(!(d==null?this.d:Yh(d,1)?Jm(this,Wh(d,1)):Im(this,d,~~tg(d)))){return false}if(!oo(f,d==null?this.c:Yh(d,1)?Hm(this,Wh(d,1)):Gm(this,d,~~tg(d)))){return false}}return true};_.hC=function Am(){var a,b,c;c=0;for(b=new Ym((new Tm(this)).b);yn(b.b);){a=Wh(zn(b.b),20);c+=a.hC();c=~~c}return c};_.tS=function Bm(){var a,b,c,d;d='{';a=false;for(c=new Ym((new Tm(this)).b);yn(c.b);){b=Wh(zn(c.b),20);a?(d+=_p):(a=true);d+=Zo+b.S();d+=wp;d+=Zo+b.T()}return d+'}'};$j(121,122,To);_.P=function Om(a,b){return _h(a)===_h(b)||a!=null&&rg(a,b)};_.d=false;_.e=0;$j(124,120,Uo);_.eQ=function Rm(a){var b,c,d;if(a===this){return true}if(!Yh(a,21)){return false}c=Wh(a,21);if(c.b.e!=this.M()){return false}for(b=new Ym(c.b);yn(b.b);){d=Wh(zn(b.b),20);if(!this.K(d)){return false}}return true};_.hC=function Sm(){var a,b,c;a=0;for(b=this.L();b.Q();){c=b.R();if(c!=null){a+=tg(c);a=~~a}}return a};$j(123,124,Uo,Tm);_.K=function Um(a){var b,c,d;if(Yh(a,20)){b=Wh(a,20);c=b.S();if(Em(this.b,c)){d=Fm(this.b,c);return fo(b.T(),d)}}return false};_.L=function Vm(){return new Ym(this.b)};_.M=function Wm(){return this.b.e};$j(125,1,{},Ym);_.Q=function Zm(){return yn(this.b)};_.R=function $m(){return Wh(zn(this.b),20)};$j(127,1,Vo);_.eQ=function bn(a){var b;if(Yh(a,20)){b=Wh(a,20);if(oo(this.S(),b.S())&&oo(this.T(),b.T())){return true}}return false};_.hC=function cn(){var a,b;a=0;b=0;this.S()!=null&&(a=tg(this.S()));this.T()!=null&&(b=tg(this.T()));return a^b};_.tS=function dn(){return this.S()+wp+this.T()};$j(126,127,Vo,en);_.S=function fn(){return null};_.T=function gn(){return this.b.c};_.U=function hn(a){return Mm(this.b,a)};$j(128,127,Vo,kn);_.S=function ln(){return this.b};_.T=function mn(){return Hm(this.c,this.b)};_.U=function nn(a){return Nm(this.c,this.b,a)};$j(129,120,{18:1});_.V=function qn(a,b){throw new pm('Add not supported on this list')};_.J=function rn(a){this.V(this.M(),a);return true};_.eQ=function tn(a){var b,c,d,e,f;if(a===this){return true}if(!Yh(a,18)){return false}f=Wh(a,18);if(this.M()!=f.M()){return false}d=new An(this);e=f.L();while(d.b<d.c.M()){b=zn(d);c=zn(e);if(!(b==null?c==null:rg(b,c))){return false}}return true};_.hC=function un(){var a,b,c;b=1;a=new An(this);while(a.b<a.c.M()){c=zn(a);b=31*b+(c==null?0:tg(c));b=~~b}return b};_.L=function wn(){return new An(this)};$j(130,1,{},An);_.Q=function Bn(){return yn(this)};_.R=function Cn(){return zn(this)};_.b=0;$j(131,129,Wo,Hn);_.V=function In(a,b){(a<0||a>this.c)&&vn(a,this.c);Nn(this.b,a,0,b);++this.c};_.J=function Jn(a){return En(this,a)};_.K=function Kn(a){return Gn(this,a,0)!=-1};_.W=function Ln(a){return sn(a,this.c),this.b[a]};_.M=function Mn(){return this.c};_.N=function Pn(){return Jh(this.b,this.c)};_.O=function Qn(a){var b;a.length<this.c&&(a=Kh(a,this.c));for(b=0;b<this.c;++b){Oh(a,b,this.b[b])}a.length>this.c&&Oh(a,this.c,null);return a};_.c=0;$j(132,129,Wo,Sn);_.K=function Tn(a){return pn(this,a)!=-1};_.W=function Un(a){return sn(a,this.b.length),this.b[a]};_.M=function Vn(){return this.b.length};_.N=function Wn(){return Ih(this.b)};_.O=function Xn(a){var b,c;c=this.b.length;a.length<c&&(a=Kh(a,c));for(b=0;b<c;++b){Oh(a,b,this.b[b])}a.length>c&&Oh(a,c,null);return a};var Yn;$j(134,129,Wo,_n);_.K=function ao(a){return false};_.W=function bo(a){throw new al};_.M=function co(){return 0};$j(135,121,{10:1,19:1},go);$j(136,127,Vo,io);_.S=function jo(){return this.b};_.T=function ko(){return this.c};_.U=function lo(a){var b;b=this.c;this.c=a;return b};$j(137,61,Po,no);$j(139,1,{},to);_.b=null;_.d=0;$j(140,100,{},vo,wo);$j(142,1,{});$j(141,142,{},Bo);var Do;var Xo=Hg();var ej=Pk(aq,'Object',1),Ji=Pk(bq,'Scheduler',67),Ii=Pk(bq,'JavaScriptObject$',64),Lj=Ok(cq,'Object;',147,ej),Ij=Rk('boolean',' Z'),Oj=Ok(Zo,'[Z',149,Ij),lj=Pk(aq,'Throwable',63),_i=Pk(aq,'Exception',62),fj=Pk(aq,'RuntimeException',61),gj=Pk(aq,'StackTraceElement',113),Mj=Ok(cq,'StackTraceElement;',150,gj),Ri=Pk('com.google.gwt.lang.','SeedUtil',88),ai=Rk('char',' C'),Jj=Ok(Zo,'[C',151,ai),$i=Pk(aq,'Class',103),kj=Pk(aq,Hp,2),Nj=Ok(cq,'String;',148,kj),Zi=Pk(aq,'ClassCastException',104),Hi=Pk(bq,'JavaScriptException',60),ij=Pk(aq,'StringBuilder',116),Yi=Pk(aq,'ArrayStoreException',101),Si=Pk(dq,'UserAgentImplGecko1_8',95),Wi=Pk(dq,'UserAgentImplSafari',99),Ti=Pk(dq,'UserAgentImplIe10',96),Vi=Pk(dq,'UserAgentImplIe9',98),Ui=Pk(dq,'UserAgentImplIe8',97),cj=Pk(aq,'NullPointerException',110),aj=Pk(aq,'IllegalArgumentException',105),Qi=Pk(eq,'StringBufferImpl',76),Hj=Pk(fq,'ExporterBaseImpl',142),Gj=Pk(fq,'ExporterBaseActual',141),Oi=Pk(eq,'StackTraceCreator$Collector',72),Ni=Pk(eq,'StackTraceCreator$CollectorMoz',74),Mi=Pk(eq,'StackTraceCreator$CollectorChrome',73),Li=Pk(eq,'StackTraceCreator$CollectorChromeNoSourceMap',75),Pi=Pk(eq,'StringBufferImplAppend',77),Ki=Pk(eq,'SchedulerImpl',69),wj=Pk(gq,'AbstractMap',122),sj=Pk(gq,'AbstractHashMap',121),nj=Pk(gq,'AbstractCollection',120),xj=Pk(gq,'AbstractSet',124),pj=Pk(gq,'AbstractHashMap$EntrySet',123),oj=Pk(gq,'AbstractHashMap$EntrySetIterator',125),vj=Pk(gq,'AbstractMapEntry',127),qj=Pk(gq,'AbstractHashMap$MapEntryNull',126),rj=Pk(gq,'AbstractHashMap$MapEntryString',128),Bj=Pk(gq,'HashMap',135),fi=Pk(hq,'WordCleaner_ExporterImpl',14),gi=Pk(hq,'WordCleaner',13),Cj=Pk(gq,'MapEntryImpl',136),hj=Pk(aq,'StringBuffer',115),uj=Pk(gq,'AbstractList',129),yj=Pk(gq,'ArrayList',131),tj=Pk(gq,'AbstractList$IteratorImpl',130),hi=Pk(iq,'OfficeImportFunction',16),ki=Pk(iq,'WordImportFunction',18),ji=Pk(iq,'WordImportFunction$1',19),di=Pk(jq,'Logged',5),ci=Pk(jq,'Logged$6',8),bi=Pk('com.ephox.functional.closures.','Thunk',4),Ai=Qk(kq,'ReplacementRuleSet'),Kj=Ok('[Lcom.ephox.tord.wordhtmlfilter.','ReplacementRuleSet;',152,Ai),mj=Pk(aq,'UnsupportedOperationException',119),oi=Pk(lq,'OrderedListTransformer',24),Ci=Pk(kq,'StepOne',53),Ei=Pk(kq,'StepTwoFilterStyles',55),Di=Pk(kq,'StepThree',54),Bi=Pk(kq,'StepLast',52),Fi=Pk(kq,'StepTwoRemoveStyles',56),Pj=Ok(Zo,'[[C',153,Jj),xi=Pk(kq,'ReadBuffer',36),Gi=Pk(kq,'WriteBuffer',57),ii=Pk(iq,'Scrub',17),Xi=Pk('com.googlecode.gwtx.java.util.impl.client.','PatternImpl',100),Fj=Pk(mq,'Pattern',140),Ej=Pk(mq,'Matcher',139),Aj=Pk(gq,'Collections$EmptyList',134),ei=Pk('com.ephox.functional.factory.','Thunks$1',10),zj=Pk(gq,'Arrays$ArrayList',132),qi=Pk(nq,'WordNumericListAttributeHandler',26),pi=Pk(nq,'WordAlphaListAttributeHandler',25),ni=Pk(lq,'ListType',23),li=Pk(lq,'ListBuilder',20),mi=Pk(lq,'ListIndex',22),ri=Pk(kq,'CharMap',27),zi=Pk(kq,'RemoveLink',44),ti=Pk(kq,'ModifySingleStyle',31),vi=Pk(kq,'ModifyStyleAttribute',32),yi=Pk(kq,'RemoveAttributeByName',37),ui=Pk(kq,'ModifyStyleAttributeOnlyUsingMustKeepList',33),bj=Pk(aq,'IndexOutOfBoundsException',106),Dj=Pk(gq,'NoSuchElementException',137),dj=Pk(aq,'NumberFormatException',112),jj=Pk(aq,'StringIndexOutOfBoundsException',117),Qj=Ok(Zo,'[[[C',154,Pj),si=Pk(kq,'IndexedStrings',30),wi=Pk(kq,'ModifyStyleDefinition',34);if (com_ephox_keurig_Keurig) com_ephox_keurig_Keurig.onScriptLoad(gwtOnLoad);})();