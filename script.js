/* ===== local-storage ===== */
/* Penyimpanan progres (LocalStorage) dengan validasi data */
const Store=(()=>{const K='lawquest.v1';
const def=()=>({xp:0,awarded:{},materi:{},quiz:{},sim:{},reflect:{},deep:{},log:[]});let s=null;
function load(){const d=def();let r=null;try{r=JSON.parse(localStorage.getItem(K));}catch(e){}
s=d;if(r&&typeof r==='object')for(const k in d){if(Array.isArray(d[k])?Array.isArray(r[k]):(r[k]!==null&&typeof r[k]===typeof d[k]))s[k]=r[k];}
if(!Number.isFinite(s.xp)||s.xp<0)s.xp=0;return s;}
function save(){try{localStorage.setItem(K,JSON.stringify(s));}catch(e){}}
return{get:()=>s||load(),save,reset(){s=def();save();}};})();

/* ===== interaction ===== */
/* Helper DOM aman (tanpa innerHTML), komponen avatar, toast. Ubah path avatar di CONFIG. */
const CONFIG={avatars:{guide:'guide.png',a1:'assets/avatars/avatar-1.png',a2:'assets/avatars/avatar-2.png',a3:'assets/avatars/avatar-3.png'}};
function el(t,a={},...c){const e=document.createElement(t);for(const k in a){if(k==='class')e.className=a[k];else if(k.startsWith('on'))e.addEventListener(k.slice(2),a[k]);else e.setAttribute(k,a[k]);}
c.flat().forEach(x=>{if(x!==null&&x!==false&&x!==undefined)e.append(x instanceof Node?x:document.createTextNode(x));});return e;}
function avatar(key='guide',cls=''){const w=el('div',{class:'avatar '+cls}),i=el('img',{src:CONFIG.avatars[key],alt:'Pemandu'});
i.addEventListener('error',()=>{i.remove();w.classList.add('ph');});w.append(i);return w;}
function guide(text,key){return el('div',{class:'guide'},avatar(key,'sm'),el('p',{},text));}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('show'),2600);}

/* Nilai minimal lulus quiz modul/tantangan, dan pengacak opsi (kecuali Benar/Salah, 'Semua...', dan opsi berangka). */
const PASS=60;
function shuf(q){if(!q||!q.o||q.o.length<3||q.o.some(t=>/^(semua|\d)/i.test(t)))return q;
const c=q.o.map((t,i)=>[t,i===q.a]);for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]];}
return Object.assign({},q,{o:c.map(z=>z[0]),a:c.findIndex(z=>z[1])});}

/* ===== gamification ===== */
/* XP, level, badge. XP hanya diberikan sekali per kunci. */
const LEVELS=[[0,'Pemula'],[100,'Penjelajah Hukum'],[250,'Pengamat Sosial'],[400,'Analis Hukum'],[600,'Penjaga Keadilan']];
const BADGES=[
{id:'first',n:'First Step',d:'Selesaikan materi pertama',f:s=>Object.keys(s.materi).length>=1},
{id:'expl',n:'Law Explorer',d:'Selesaikan dua modul',f:s=>Game.modsDone(s)>=2},
{id:'think',n:'Critical Thinker',d:'Selesaikan simulasi kasus',f:s=>Object.keys(s.sim).length>=1},
{id:'just',n:'Justice Seeker',d:'Selesaikan Modul 2 (keadilan)',f:s=>Game.modDone(s,'m2')},
{id:'master',n:'Law Master',d:'Selesaikan semua modul + tantangan akhir',f:s=>Game.modsDone(s)>=4&&!!s.awarded.final}];
const Game={
modDone:(s,id)=>!!(s.materi[id]&&s.quiz[id]&&s.quiz[id].best>=PASS),
modsDone:s=>MODULES.filter(m=>Game.modDone(s,m.id)).length,
award(key,xp,label){const s=Store.get();if(s.awarded[key])return false;s.awarded[key]=1;s.xp+=xp;
s.log.unshift({t:Date.now(),m:label+' (+'+xp+' XP)'});s.log=s.log.slice(0,12);Store.save();toast('+'+xp+' XP · '+label);Game.after();return true;},
after(){const s=Store.get();MODULES.forEach(m=>{if(Game.modDone(s,m.id))Game.award('mod'+m.id,50,'Modul selesai: '+m.title);});
BADGES.forEach(b=>{if(b.f(s)&&!s.awarded['b_'+b.id]){s.awarded['b_'+b.id]=1;Store.save();toast('Badge baru: '+b.n);}});
const c=document.getElementById('xpChip');if(c)c.textContent=s.xp+' XP';},
level(xp){let i=0;LEVELS.forEach((l,k)=>{if(xp>=l[0])i=k;});const nx=LEVELS[i+1];
return{n:i+1,name:LEVELS[i][1],next:nx?nx[0]:null,pct:nx?Math.round((xp-LEVELS[i][0])/(nx[0]-LEVELS[i][0])*100):100};}};

/* ===== progress ===== */
const Progress={total:()=>MODULES.length*2+SIMS.length+1,
done(){const s=Store.get();return MODULES.filter(m=>s.materi[m.id]).length+MODULES.filter(m=>s.quiz[m.id]).length+Object.keys(s.sim).length+(s.awarded.final?1:0);},
pct(){return Math.round(this.done()/this.total()*100);},
status(i){const s=Store.get(),m=MODULES[i];if(Game.modDone(s,m.id))return'done';if(i>0&&!Game.modDone(s,MODULES[i-1].id))return'lock';return(s.materi[m.id]||s.quiz[m.id])?'prog':'avail';}};
const STL={done:'Selesai',prog:'Sedang berjalan',avail:'Tersedia',lock:'Terkunci'};

/* ===== data-materi ===== */
/* Materi: Buku Pendidikan Pancasila Kelas X, Bab 2 (hlm. 60-126). Item {t,d} tampil sebagai kartu buka-tutup. */
const MODULES=[
{id:'m1',title:'Membangun Kesadaran Hukum',sub:'Hlm. 64-71',tabs:[
{t:'Kesadaran hukum',i:['Kesadaran hukum: mengetahui dan mengerti tindakan hukum beserta akibatnya, serta mampu membedakan perilaku baik dan buruk.',{t:'Ciri kesadaran hukum tinggi',d:'Ketaatan dilakukan semua kalangan; hak dan kewajiban dipahami; pelanggaran rendah; kepercayaan pada aparat tinggi; penegakan hukum tanpa diskriminasi.'},{t:'Dasar konstitusional',d:'Pasal 1 ayat (3) UUD NRI 1945: Negara Indonesia adalah negara hukum.'}]},
{t:'Tujuan hukum',i:['Hukum bertujuan mengatur pergaulan hidup secara damai demi ketertiban dan ketenteraman.',{t:'Teori tujuan hukum',d:'Keadilan, kemanfaatan (utilitas), gabungan keadilan dan manfaat, serta ketertiban dan ketenteraman masyarakat.'},{t:'Penegak hukum',d:'Polisi mencegah dan menanggulangi kejahatan; jaksa menuntut perkara pidana; hakim memutus perkara di pengadilan.'}]},
{t:'Sumber hukum',i:['Pancasila adalah sumber dari segala sumber hukum.',{t:'Tertulis',d:'Tercantum dalam peraturan negara, sesuai tata urutan perundang-undangan.'},{t:'Tidak tertulis',d:'Hukum yang hidup di masyarakat, seperti adat atau kebiasaan positif.'}]},
{t:'Jenis norma',i:[{t:'Kesusilaan',d:'Bersumber dari hati nurani manusia.'},{t:'Kesopanan',d:'Bersumber dari adat dan tata pergaulan antarwarga.'},{t:'Agama',d:'Bersumber dari kepercayaan kepada Tuhan YME (kitab suci).'},{t:'Hukum',d:'Bersumber dari hukum yang berlaku.'}]}],
reflect:'Mengapa seseorang perlu menaati hukum meskipun tidak sedang diawasi?'},
{id:'m2',title:'Menerapkan Perilaku Taat Hukum',sub:'Hlm. 74-89',tabs:[
{t:'Hukum dan norma',i:['Norma hukum adalah bagian dari norma masyarakat. Sifatnya mengikat, memaksa, otonom, dan responsif.',{t:'Contoh di sekolah',d:'Tata tertib siswa: berpakaian, waktu belajar, aturan masuk dan pulang, sopan santun.'}]},
{t:'3 prinsip',i:[{t:'Keadilan',d:'Hukum berlaku bagi semua tanpa diskriminasi; pelanggar disanksi sesuai undang-undang.'},{t:'Kemanfaatan',d:'Hukum memberi manfaat dan berdampak positif bagi masyarakat.'},{t:'Kepastian',d:'Perintah dan larangan jelas, tegas, tidak multitafsir, tidak kontradiktif.'}]},
{t:'Klasifikasi hukum',i:[{t:'Isi',d:'Hukum publik dan hukum privat.'},{t:'Bentuk',d:'Tertulis dan tidak tertulis.'},{t:'Sifat',d:'Memaksa dan mengatur.'},{t:'Cara mempertahankan',d:'Hukum materiel dan hukum acara.'},{t:'Tempat berlaku',d:'Nasional, negara lain, internasional.'}]},
{t:'Taat hukum',i:['Ciri: memahami pentingnya penegakan hukum, tidak merugikan orang lain, dan aktif menjalankan perintah serta meninggalkan larangan hukum.',{t:'Karena terpaksa',d:'Menaati hukum karena takut sanksi; butuh pengawasan rutin.'},{t:'Identifikasi',d:'Menaati hukum agar hubungan baik dengan pihak lain tidak terganggu.'},{t:'Kesadaran diri',d:'Menaati hukum karena sesuai nilai yang dianut. Ini yang diharapkan.'}]},
{t:'Keadilan Pancasila',i:['Adil bukan sama rata, tetapi proporsional. Keadilan ada pada sila ke-2 dan ke-5.',{t:'Equity vs equality',d:'Contoh buku: uang saku kakak SMA berbeda dari adik SD karena kebutuhannya berbeda.'},{t:'Cara mewujudkan',d:'Keadilan sebagai tujuan pembangunan, pandangan equity, kesatuan paham kebangsaan, musyawarah mufakat, keselarasan hak dan kewajiban.'}]}],
reflect:'Bagaimana cara menerapkan keadilan dalam kehidupan sekolah?'},
{id:'m3',title:'Pelanggaran Hak dan Pengingkaran Kewajiban',sub:'Hlm. 90-99',tabs:[
{t:'Hak & kewajiban',i:['Hak adalah sesuatu yang diterima seseorang; kewajiban adalah sesuatu yang harus dilakukan dengan tanggung jawab.',{t:'Seimbang, serasi, selaras',d:'Hak dan kewajiban dilaksanakan seimbang, serasi (harmonis), dan selaras (tidak bertentangan dengan norma dan hukum).'},{t:'Pasal 27 ayat (1) UUD 1945',d:'Segala warga negara bersamaan kedudukannya di dalam hukum dan pemerintahan dan wajib menjunjung hukum itu dengan tidak ada kecualinya.'}]},
{t:'Faktor penyebab',i:[{t:'Sikap egois',d:'Mementingkan diri dan kurang menghargai orang lain.'},{t:'Kurangnya kesadaran',d:'Memicu sikap sewenang-wenang, tidak bertanggung jawab, dan diskriminasi.'},{t:'Merasa eksklusif',d:'Merasa spesial karena jabatan, kekayaan, atau kerabat.'},{t:'Penyalahgunaan teknologi',d:'Contoh: limbah industri yang tidak dikelola mencemari lingkungan dan melanggar hak warga.'}]},
{t:'Warga global',i:['Pelajar Pancasila berkebinekaan global: terbuka pada budaya lain, tetap berpegang pada nilai Pancasila.',{t:'Hoaks',d:'Hoaks mengancam hak orang atas ketenangan. Cek kebenaran, periksa sumber, waspada judul provokatif, laporkan ke pihak berwenang.'},{t:'Narkoba',d:'Mengonsumsi narkoba bukan hak; negara dan warga wajib mencegahnya.'}]}],
reflect:'Mengapa hak harus berjalan beriringan dengan kewajiban?'},
{id:'m4',title:'Produk dan Hierarki Peraturan Perundang-undangan',sub:'Hlm. 100-120',tabs:[
{t:'Hierarki (klik)',i:['Dasar: Pasal 7 ayat (1) UU 12/2011 jo. UU 13/2022. Klik tiap tingkat.',{t:'1. UUD NRI Tahun 1945',d:'Tertinggi. Ditetapkan PPKI 18 Agustus 1945; perubahan oleh MPR.'},{t:'2. Ketetapan MPR',d:'Ditetapkan oleh MPR.'},{t:'3. UU / Perppu',d:'UU disetujui DPR dan Presiden. Perppu ditetapkan Presiden dalam kepentingan yang memaksa.'},{t:'4. Peraturan Pemerintah',d:'Ditetapkan Presiden untuk menjalankan UU.'},{t:'5. Peraturan Presiden',d:'Menjalankan perintah aturan yang lebih tinggi atau penyelenggaraan pemerintahan.'},{t:'6. Perda Provinsi',d:'Disetujui DPRD Provinsi dan Gubernur.'},{t:'7. Perda Kabupaten/Kota',d:'Disetujui DPRD Kab/Kota dan Bupati/Walikota.'}]},
{t:'Asas',i:[{t:'Lex superiori derogat legi inferiori',d:'Aturan lebih rendah tidak boleh bertentangan dengan yang lebih tinggi.'},{t:'Lex specialis derogat legi generali',d:'Pada derajat sama dan materi sama, aturan khusus mengesampingkan yang umum.'},{t:'Lex posteriori derogat legi priori',d:'Pada derajat sama, aturan baru mengesampingkan yang lama.'}]},
{t:'Harmonisasi & sinkronisasi',i:[{t:'Harmonisasi',d:'Penyelarasan rancangan peraturan agar sesuai prinsip hukum dan peraturan yang baik.'},{t:'Sinkronisasi',d:'Penyelarasan peraturan agar tidak tumpang tindih. Vertikal: dengan aturan di atasnya. Horizontal: dengan aturan sederajat.'},{t:'Judicial review',d:'UU yang bertentangan dengan UUD diuji di Mahkamah Konstitusi. Aturan di bawah UU diuji di Mahkamah Agung.'}]},
{t:'Pancasila',i:['Pancasila adalah sumber dari segala sumber hukum; rumusannya ada di alinea IV Pembukaan UUD 1945.',{t:'Hubungan dengan UUD',d:'Jika Pancasila rohnya, UUD NRI 1945 raganya.'},{t:'Syarat isi peraturan',d:'Searah dengan aturan di atasnya, dapat dilaksanakan dan memberi kepastian, serta selaras dengan keadilan dan kepentingan rakyat.'}]}],
reflect:'Apa yang dapat dilakukan warga ketika menemukan aturan yang dinilai bertentangan dengan aturan di atasnya?'}];

/* ===== data-quiz ===== */
/* Soal: q=pertanyaan, o=opsi, a=indeks kunci, e=pembahasan. Benar/Salah memakai opsi ['Benar','Salah']. */
const TF=['Benar','Salah'];
const QUIZ={
m1:[{q:'Kesadaran hukum berarti...',o:['Takut pada sanksi','Mengetahui dan mengerti tindakan hukum beserta akibatnya','Menghafal pasal','Mengikuti teman'],a:1,e:'Menurut buku, kesadaran hukum adalah mengetahui dan mengerti tindakan hukum beserta akibatnya.'},
{q:'Norma kesusilaan bersumber dari hati nurani manusia.',o:TF,a:0,e:'Kesusilaan bersumber dari hati nurani; kesopanan dari adat dan tata pergaulan.'},
{q:'Dasar konstitusional negara hukum ada pada...',o:['Pasal 1 ayat (3) UUD 1945','Pasal 7 UU 12/2011','Pasal 29 UUD 1945','Pasal 33 UUD 1945'],a:0,e:'Pasal 1 ayat (3): Negara Indonesia adalah negara hukum.'}],
m2:[{q:'Ketaatan yang paling diharapkan adalah...',o:['Karena terpaksa','Karena takut kehilangan teman','Karena kesadaran diri','Karena diawasi'],a:2,e:'Kesadaran diri: menaati hukum karena sesuai nilai yang dianut.'},
{q:'Berlaku adil berarti memberi hak yang sama persis kepada semua orang.',o:TF,a:1,e:'Adil berarti proporsional sesuai kebutuhan (equity), seperti uang saku kakak dan adik.'},
{q:'Hukum harus jelas, tegas, dan tidak multitafsir. Ini prinsip...',o:['Keadilan','Kemanfaatan','Kepastian','Otonom'],a:2,e:'Kepastian hukum menuntut perintah dan larangan yang jelas.'}],
m3:[{q:'Seseorang menuntut hak terus-menerus tetapi mengabaikan kewajiban. Penyebabnya paling dekat dengan...',o:['Sikap egois','Toleransi','Musyawarah','Sinkronisasi'],a:0,e:'Sikap egois: terlalu banyak menuntut hak, kewajiban diabaikan.'},
{q:'Mengonsumsi narkoba termasuk hak setiap orang.',o:TF,a:1,e:'Buku menegaskan mengonsumsi narkoba bukanlah hak.'},
{q:'Langkah awal menyikapi kabar yang belum jelas kebenarannya adalah...',o:['Langsung membagikan','Cek kebenaran dan sumbernya','Menghapus komentar','Menunggu viral'],a:1,e:'Cek kebenaran dan keakuratan informasi sebelum menyebarkan.'}],
m4:[{q:'Peraturan tertinggi dalam hierarki adalah...',o:['UU','Ketetapan MPR','UUD NRI 1945','Peraturan Presiden'],a:2,e:'UUD NRI 1945 berada di puncak hierarki.'},
{q:'Perda Kabupaten/Kota boleh bertentangan dengan Perda Provinsi.',o:TF,a:1,e:'Aturan lebih rendah tidak boleh bertentangan dengan yang lebih tinggi (lex superiori).'},
{q:'UU yang dinilai bertentangan dengan UUD diuji di...',o:['Mahkamah Agung','DPR','Mahkamah Konstitusi','Presiden'],a:2,e:'Judicial review UU terhadap UUD dilakukan di Mahkamah Konstitusi.'}]};
QUIZ.final=[QUIZ.m1[0],QUIZ.m2[0],QUIZ.m3[1],QUIZ.m4[0],QUIZ.m4[2]];

/* ===== data-simulasi ===== */
/* Simulasi bercabang. Tiap opsi punya respons dan skor 0-2 (butuh pertimbangan, bukan benar/salah tunggal). */
const SIMS=[
{id:'s1',title:'Terlambat Berulang',intro:'Raka tiga kali seminggu ini terlambat. Ia bilang, "Cuma beberapa menit, kok." Kamu sekelas dengannya dan guru piket mulai kesal.',steps:[
{q:'Norma apa yang paling langsung dilanggar Raka?',o:[{t:'Norma hukum tertulis: tata tertib sekolah',r:'Tepat. Tata tertib siswa adalah norma hukum tertulis di sekolah.',s:2},{t:'Norma agama',r:'Kurang langsung. Fokus utama kasus ini adalah aturan tertulis sekolah.',s:0},{t:'Tidak ada, hanya telat sedikit',r:'Telat berulang tetap melanggar tata tertib dan mengganggu kelas.',s:0}]},
{q:'Apa tindakanmu?',o:[{t:'Mengajaknya bicara baik-baik dan menawarkan cara bangun lebih awal',r:'Pilihan damai yang menjaga hubungan. Cocok dengan penyelesaian secara kekeluargaan.',s:2},{t:'Melaporkan langsung ke guru tanpa bicara',r:'Boleh sebagai langkah lanjutan, tapi dialog dulu biasanya lebih adil bagi semua.',s:1},{t:'Membiarkan saja',r:'Pembiaran membuat disiplin sulit membudaya.',s:0}]}]},
{id:'s2',title:'Fasilitas yang Tidak Dijaga',intro:'Sekelompok siswa memakai lapangan sekolah, lalu meninggalkan sampah dan botol berserakan. Hak memakai fasilitas jelas ada.',steps:[
{q:'Bagaimana hubungan hak dan kewajiban di sini?',o:[{t:'Hak memakai fasilitas disertai kewajiban merawat dan menjaga kebersihan',r:'Tepat. Hak dan kewajiban harus seimbang, serasi, dan selaras.',s:2},{t:'Hak lebih penting karena fasilitas milik semua',r:'Fasilitas milik bersama, justru karena itu kewajiban menjaganya juga bersama.',s:0},{t:'Kewajiban hanya milik petugas kebersihan',r:'Setiap pengguna ikut bertanggung jawab.',s:0}]},
{q:'Langkah terbaik?',o:[{t:'Memungut sampah sendiri dan mengajak kelompok membuat jadwal piket bersama',r:'Memberi contoh dan menyelesaikan masalah lewat musyawarah.',s:2},{t:'Menegur keras di depan umum',r:'Niatnya baik, tapi cara emosional bisa memicu konflik. Aspirasi sebaiknya santun.',s:1},{t:'Pura-pura tidak tahu',r:'Mengabaikan kewajiban bersama melemahkan keadilan bagi pengguna berikutnya.',s:0}]}]}];

/* ===== data-topik (pembelajaran bertahap) ===== */
const R=(k,items)=>({k,type:'read',items}),QZ=(k,qs)=>({k,type:'quiz',qs}),SM=(k,sim)=>({k,type:'sim',sim}),RF=(k,prompt)=>({k,type:'reflect',prompt});
SIMS.push(
{id:'s3',title:'Ponsel di Jam Pelajaran',intro:'Seorang siswa memakai ponsel saat pembelajaran. Aturan sekolah melarang ponsel kecuali untuk belajar atas izin guru. Ia beralasan sedang membalas pesan penting dari keluarga. Guru menegur dan meminta ponselnya diserahkan sementara.',steps:[
{q:'Norma apa yang paling berkaitan?',o:[{t:'Norma hukum tertulis (tata tertib) dan norma kesopanan',r:'Tepat. Tata tertib adalah norma tertulis, dan sopan santun di kelas menyangkut kesopanan.',s:2},{t:'Hanya norma agama',r:'Kasus ini tidak berpusat pada ajaran agama.',s:0},{t:'Tidak ada, ini urusan pribadi',r:'Di kelas, tindakan pribadi tetap terikat tata tertib dan memengaruhi orang lain.',s:0}]},
{q:'Apakah alasan keluarga membenarkan tindakan siswa?',o:[{t:'Alasannya patut didengar, tetapi caranya harus lewat izin guru; pelanggaran tetap terjadi',r:'Seimbang. Aturan menyediakan jalur izin, jadi kebutuhan mendesak bisa dipenuhi tanpa melanggar.',s:2},{t:'Tidak, alasan pribadi tidak pernah boleh dipertimbangkan',r:'Terlalu kaku. Keadilan juga menimbang kebutuhan, selama aturan tetap dihormati.',s:1},{t:'Ya, keluarga lebih penting sehingga aturan tidak berlaku',r:'Jika alasan pribadi meniadakan aturan, kepastian hukum hilang dan siswa lain diperlakukan tidak adil.',s:0}]},
{q:'Tindakan guru yang paling tepat?',o:[{t:'Menyita sementara sesuai aturan, mendengar alasan, dan membantu menghubungi keluarga lewat sekolah',r:'Menjaga kepastian aturan, keadilan, dan kemanfaatan sekaligus.',s:2},{t:'Menyita dan menegur keras di depan kelas',r:'Aturannya benar, caranya merendahkan martabat siswa. Melanggar norma kesopanan.',s:0},{t:'Membiarkan karena kasihan',r:'Siswa lain bisa menilai aturan tidak pasti dan tidak adil.',s:1}]}]},
{id:'s4',title:'Guru Keluar Kelas',intro:'Saat ujian, guru keluar sebentar. Temanmu menggeser lembar jawabannya dan berbisik, "Lihat aja, nggak ada yang tahu."',steps:[
{q:'Apa yang kamu lakukan?',o:[{t:'Menolak dengan sopan dan tetap mengerjakan sendiri',r:'Kamu menaati aturan karena memahami nilainya, bukan karena diawasi. Ini ketaatan karena kesadaran diri.',s:2},{t:'Menolak, tetapi hanya karena takut ketahuan',r:'Perilaku benar, alasannya takut sanksi (ketaatan terpaksa). Alasan ini rapuh saat pengawasan hilang.',s:1},{t:'Ikut melihat agar temanmu tidak marah',r:'Keputusanmu dipengaruhi hubungan dengan teman, bukan nilai aturan. Menyontek melanggar tata tertib.',s:0}]},
{q:'Temanmu kesal setelah ujian. Bagaimana menyikapinya?',o:[{t:'Menjelaskan baik-baik bahwa kamu ingin jujur, lalu menawarkan belajar bersama',r:'Aturan tetap ditegakkan dan hubungan tetap terjaga.',s:2},{t:'Diam dan menjauhinya',r:'Tidak melanggar aturan, tetapi masalah hubungan tidak terselesaikan.',s:1},{t:'Mengumumkannya ke seluruh kelas',r:'Mempermalukan teman melanggar norma kesopanan dan memperburuk keadaan.',s:0}]}]});
const TOPICS={m2:[
{id:'t_taat',title:'Jenis ketaatan hukum',stages:[
R('Pahami',['Buku (hlm. 81) membedakan tiga jenis ketaatan hukum menurut H.C. Kelman dan L. Pospisil.',{t:'Terpaksa',d:'Menaati hukum karena takut sanksi. Butuh pengawasan rutin.'},{t:'Identifikasi (mengikuti)',d:'Menaati hukum karena khawatir hubungan baik dengan orang atau pihak lain terganggu.'},{t:'Kesadaran diri',d:'Menaati hukum karena merasa hukum itu sesuai dengan nilai yang dianut.'}]),
R('Bedah konsep',['Bagian ini pengembangan penyusun dari isi buku.',{t:'Apa yang membedakan ketiganya?',d:'Bukan perilakunya, tetapi alasan di baliknya. Dua siswa sama-sama tidak terlambat, namun satu karena takut dihukum, satu karena paham manfaat disiplin.'},{t:'Mengapa ketaatan terpaksa butuh pengawasan?',d:'Alasannya bergantung pada sanksi. Saat pengawasan hilang, alasan menaati ikut hilang.'},{t:'Mana yang diharapkan?',d:'Kesadaran diri, karena ketaatan tetap ada walau tidak diawasi.'}]),
QZ('Analisis',[{q:'Dewi tidak menyontek karena takut dipanggil guru BK. Jenis ketaatannya...',o:['Terpaksa','Identifikasi','Kesadaran diri'],a:0,e:'Motivasinya takut sanksi, jadi ketaatan terpaksa.'},{q:'Raka tidak membuang sampah sembarangan karena semua temannya begitu dan ia tidak mau dijauhi. Jenis ketaatannya...',o:['Terpaksa','Identifikasi','Kesadaran diri'],a:1,e:'Ia menjaga hubungan dengan kelompok: identifikasi.'}]),
SM('Simulasi','s4'),
QZ('Evaluasi',[{q:'Sinta berseragam sesuai aturan walau tidak ada guru, karena paham aturan itu menjaga ketertiban dan kesetaraan. Ini ketaatan...',o:['Terpaksa','Identifikasi','Kesadaran diri'],a:2,e:'Ia menaati karena nilai aturan, bukan karena diawasi.'},{q:'Mengapa ketaatan karena terpaksa kurang diharapkan?',o:['Karena sanksi tidak pernah ada','Karena bergantung pada pengawasan sehingga mudah hilang','Karena membuat siswa pintar'],a:1,e:'Tanpa pengawasan, alasan menaati hilang.'}]),
RF('Refleksi','Apakah kamu menaati aturan sekolah karena takut atau karena memahami nilainya? Berikan contoh.')]},
{id:'t_prinsip',title:'Keadilan, kemanfaatan, kepastian',stages:[
R('Pahami',['Tiga prinsip yang harus ditegakkan dalam hukum (buku hlm. 77-78).',{t:'Keadilan',d:'Hukum berlaku bagi semua tanpa diskriminasi; pelanggar disanksi sesuai undang-undang.'},{t:'Kemanfaatan',d:'Hukum memberi manfaat dan berdampak positif bagi masyarakat.'},{t:'Kepastian',d:'Perintah dan larangan jelas, tegas, tidak multitafsir, tidak kontradiktif.'}]),
R('Bedah konsep',['Contoh di bawah dari penyusun, bukan dari buku.',{t:'Aturan ponsel di kelas',d:'Kepastian: larangan dan pengecualiannya jelas. Kemanfaatan: menjaga fokus belajar. Keadilan: berlaku sama untuk semua siswa, dengan sanksi yang proporsional.'},{t:'Kapan prinsip bisa bertabrakan?',d:'Menyita ponsel demi kepastian bisa terasa kurang adil bila ada kebutuhan mendesak. Aturan yang baik menyediakan jalur izin.'}]),
QZ('Analisis',[{q:'Aturan melarang ponsel saat belajar kecuali izin guru. Norma yang paling langsung terkait...',o:['Norma hukum tertulis (tata tertib) dan kesopanan','Hanya norma agama','Tidak ada norma'],a:0,e:'Tata tertib adalah norma tertulis di sekolah.'},{q:'Pengecualian "atas izin guru" paling menunjukkan...',o:['Kepastian dan keadilan: aturan jelas dan memberi jalur bagi kebutuhan mendesak','Hukuman semata','Kemanfaatan tanpa kepastian'],a:0,e:'Aturan jelas dan tetap memberi ruang bagi kebutuhan nyata.'}]),
SM('Simulasi','s3'),
QZ('Evaluasi',[{q:'Dua siswa melanggar aturan yang sama, tetapi hanya satu ditegur karena dekat dengan guru. Prinsip yang dilanggar...',o:['Kemanfaatan','Keadilan','Kepastian'],a:1,e:'Hukum harus berlaku bagi semua tanpa diskriminasi.'},{q:'Aturan berbunyi "ponsel dilarang kadang-kadang". Masalahnya...',o:['Mengurangi kepastian karena multitafsir','Terlalu adil','Terlalu bermanfaat'],a:0,e:'Kepastian menuntut aturan jelas dan tidak multitafsir.'}]),
RF('Refleksi','Apakah aturan penggunaan ponsel di sekolahmu sudah adil, bermanfaat, dan pasti? Jelaskan alasanmu.')]}]};
/* ===== navigation ===== */
const NAV=[['beranda','Beranda'],['dashboard','Dashboard'],['peta','Peta Pembelajaran'],['materi','Materi'],['simulasi','Simulasi Kasus'],['tantangan','Tantangan'],['pencapaian','Pencapaian'],['progres','Progres Belajar']];
const Nav={init(){const n=document.getElementById('nav'),b=document.getElementById('menuBtn');
n.append(el('div',{class:'brand'},'LAW',el('i',{},'QUEST')),...NAV.map(([k,t])=>el('a',{href:'#/'+k,'data-k':k},t)));
b.addEventListener('click',()=>{const o=n.classList.toggle('open');b.setAttribute('aria-expanded',o);});
n.addEventListener('click',e=>{if(e.target.tagName==='A'){n.classList.remove('open');b.setAttribute('aria-expanded',false);}});
const sk=document.querySelector('.skip');if(sk)sk.addEventListener('click',e=>{e.preventDefault();document.getElementById('view').focus();});
addEventListener('hashchange',Nav.go);},
go(){if(location.hash&&!location.hash.startsWith('#/'))return;const [k,a]=(location.hash.replace('#/','')||'beranda').split('/');
document.querySelectorAll('#nav a').forEach(x=>{const on=x.dataset.k===k||(k==='m'&&x.dataset.k==='materi')||(k==='s'&&x.dataset.k==='simulasi');on?x.setAttribute('aria-current','page'):x.removeAttribute('aria-current');});
const v=document.getElementById('view');v.replaceChildren();(Object.prototype.hasOwnProperty.call(Views,k)?Views[k]:Views.beranda)(v,a);v.focus();scrollTo({top:0,behavior:'instant'});}};

/* ===== app ===== */
/* Tampilan utama LAW QUEST. Semua teks disisipkan lewat textContent (aman). */
function bar(p){return el('div',{class:'bar',role:'progressbar','aria-valuenow':p,'aria-valuemin':0,'aria-valuemax':100},el('i',{style:'width:'+p+'%'}));}
function stat(n,l){return el('div',{class:'card stat'},el('b',{},n),el('span',{class:'muted'},l));}
function nextHref(){const i=[0,1,2,3].find(k=>Progress.status(k)!=='done');return i===undefined?'#/tantangan':'#/m/'+MODULES[i].id;}
function runQuiz(qs0,root,onEnd,pass){pass=pass===undefined?PASS:pass;let qs=qs0.map(shuf),i=0,sc=0;(function step(){root.replaceChildren();
if(i>=qs.length){const p=Math.round(sc/qs.length*100);root.append(el('h3',{},'Hasil: '+sc+' / '+qs.length+' ('+p+'%)'),el('p',{class:'muted'},p>=pass?'Lulus. Kerja bagus!':'Belum lulus (minimal '+pass+'%). Pelajari lagi, lalu ulangi quiz.'));onEnd(p,sc);
root.append(el('button',{class:'btn alt',onclick:()=>{qs=qs0.map(shuf);i=0;sc=0;step();}},'Ulangi quiz'));return;}
const q=qs[i],opts=[],fb=el('div',{class:'fb',hidden:'',role:'status'}),nx=el('button',{class:'btn',hidden:'',onclick:()=>{i++;step();}},i+1<qs.length?'Soal berikutnya':'Lihat hasil');let done=false;
q.o.forEach((t,k)=>opts.push(el('button',{class:'opt',onclick:()=>{if(done)return;done=true;if(k===q.a)sc++;opts.forEach((b,j)=>{b.disabled=true;if(j===q.a)b.classList.add('ok');else if(j===k)b.classList.add('no');});
fb.textContent=(k===q.a?'Benar. ':'Belum tepat. ')+q.e;fb.hidden=false;nx.hidden=false;nx.focus();}},t)));
root.append(bar(i/qs.length*100),el('p',{class:'muted'},'Soal '+(i+1)+' dari '+qs.length),el('h3',{},q.q),...opts,fb,nx);})();}
function saveQuiz(id,p,xpKey,xp,label){const s=Store.get(),q=s.quiz[id]||{best:0,hist:[]};q.best=Math.max(q.best,p);q.hist.push({t:Date.now(),p});q.hist=q.hist.slice(-10);s.quiz[id]=q;Store.save();if(p>=PASS)Game.award(xpKey,xp,label);Game.after();}

function shufArr(a){const c=a.slice();for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]];}return c;}
function runSim(c,box,onEnd){let i=0,tot=0;(function step(){box.replaceChildren();if(i>=c.steps.length){const mx=c.steps.length*2;box.append(el('h3',{},'Skor pertimbanganmu: '+tot+' / '+mx));onEnd(tot,mx);return;}
const st=c.steps[i],fb=el('div',{class:'fb',hidden:''}),nx=el('button',{class:'btn',hidden:'',onclick:()=>{i++;step();}},'Lanjut');let d=false;
box.append(el('h3',{},st.q),...shufArr(st.o).map(o=>el('button',{class:'opt',onclick:e=>{if(d)return;d=true;tot+=o.s;if(o.s!==1)e.currentTarget.classList.add(o.s===2?'ok':'no');fb.textContent=o.r;fb.hidden=false;nx.hidden=false;}},o.t)),fb,nx);})();}
function doneSim(c,t,mx){const s=Store.get();const o=s.sim[c.id];s.sim[c.id]={score:Math.max(t,o?o.score:0),max:mx};Store.save();Game.award('sim'+c.id,25,'Simulasi: '+c.title);}
function readItems(items){return items.map(x=>{
if(typeof x==='string')return el('p',{},x);
if(x.h)return el('h3',{},x.h);
if(x.tb){const t=x.tb;return el('div',{class:'tbl',tabindex:'0',role:'region','aria-label':t.c||'Tabel'},el('table',{},t.c?el('caption',{},t.c):null,el('thead',{},el('tr',{},...t.h.map(c=>el('th',{scope:'col'},c)))),el('tbody',{},...t.r.map(r=>el('tr',{},...r.map((c,j)=>j?el('td',{},c):el('th',{scope:'row'},c)))))));}
if(x.fl)return el('ol',{class:'flow'},...x.fl.map(c=>el('li',{},c)));
return el('details',{},el('summary',{},x.t),...(Array.isArray(x.d)?x.d:[x.d]).map(p=>el('p',{},p)));});}
function topicView(t){const s=Store.get(),d=s.deep[t.id]=s.deep[t.id]||{},card=el('div',{class:'card',style:'margin:12px 0'}),nav=el('div',{class:'tabs',role:'tablist'}),box=el('div',{});
const last=t.stages.length-1;
function upd(k){nav.replaceChildren(...t.stages.map((g,j)=>{const a={class:'tab',role:'tab','aria-selected':String(j===k)};if(j&&!d[j-1])a.disabled='';a.onclick=()=>draw(j);return el('button',a,(d[j]?'✓ ':'')+g.k);}));}
function mark(k,sc){if(!d[k]){d[k]=1;Game.award('st'+t.id+k,10,t.title+': '+t.stages[k].k);}if(sc!==undefined)d['p'+k]=Math.max(d['p'+k]||0,sc);Store.save();upd(k);}
function nextBtn(k){if(k<last)box.append(el('p',{},el('button',{class:'btn',onclick:()=>draw(k+1)},'Tahap berikutnya: '+t.stages[k+1].k)));else box.append(guide('Topik ini selesai. Lanjutkan ke topik lain atau jurnal refleksi.'));}
function draw(k){upd(k);box.replaceChildren();const g=t.stages[k];
if(g.type==='read'){box.append(...readItems(g.items),el('p',{},el('button',{class:'btn',onclick:()=>{mark(k);draw(Math.min(k+1,last));}},k<last?'Saya paham, lanjut':'Selesai')));}
else if(g.type==='quiz'){const q=el('div',{});box.append(q);runQuiz(g.qs,q,p=>{if(p>=50)mark(k,p);else toast('Belum cukup. Ulangi quiz untuk membuka tahap berikutnya.');},50);box.append(el('p',{},el('button',{class:'btn alt',onclick:()=>{if(d[k])draw(k+1<=last?k+1:k);else toast('Selesaikan soal dulu.');}},'Tahap berikutnya')));}
else if(g.type==='sim'){const c=SIMS.find(x=>x.id===g.sim),b=el('div',{});box.append(guide(c.intro),b);runSim(c,b,(tt,mx)=>{doneSim(c,tt,mx);mark(k,Math.round(tt/mx*100));nextBtn(k);});}
else{const ta=el('textarea',{'aria-label':'Refleksi'});ta.value=s.reflect[t.id]||'';box.append(el('p',{},g.prompt),ta,el('p',{},el('button',{class:'btn',onclick:()=>{if(ta.value.trim().length<10){toast('Tulis minimal satu kalimat.');return;}s.reflect[t.id]=ta.value.slice(0,2000);Store.save();mark(k);toast('Refleksi disimpan');}},'Simpan refleksi')));}}
card.append(el('h3',{},t.title),nav,box);draw(Math.max(0,t.stages.findIndex((g,j)=>!d[j])===-1?0:t.stages.findIndex((g,j)=>!d[j])));return card;}
function topicsView(mid){const ts=TOPICS[mid]||[],w=el('div',{});if(!ts.length)return w;w.append(el('h3',{},'Belajar bertahap'),el('p',{class:'muted'},'Pahami, bedah konsep, analisis, simulasi, evaluasi, lalu refleksi. Tiap tahap +10 XP.'));ts.forEach(t=>w.append(topicView(t)));return w;}
function mastery(i){const s=Store.get(),m=MODULES[i],ts=TOPICS[m.id]||[];let st=0,n=0;ts.forEach(t=>{const d=s.deep[t.id]||{};t.stages.forEach((g,k)=>{n++;if(d[k])st++;});});
const ko=s.materi[m.id]?1:0,ev=(s.quiz[m.id]?s.quiz[m.id].best:0)/100,rf=s.reflect[m.id]?1:0;
return Math.round(n?ko*25+st/n*25+ev*30+rf*20:ko*35+ev*45+rf*20);}
function masteryView(){return el('div',{},el('h3',{},'Penguasaan materi'),el('p',{class:'muted'},'Dihitung dari konsep, penerapan bertahap, hasil quiz, dan refleksi, bukan dari XP.'),...MODULES.map((m,i)=>el('div',{style:'margin:8px 0'},el('span',{},m.title+': '+mastery(i)+'%'),bar(mastery(i)))));}
function journal(){const s=Store.get(),L=[];MODULES.forEach(m=>{L.push([m.title,s.reflect[m.id]]);(TOPICS[m.id]||[]).forEach(t=>L.push([t.title,s.reflect[t.id]]));});return L.map(([a,b])=>el('p',{},el('b',{},a+': '),b||'-'));}
const Views={
beranda(v){v.append(el('section',{class:'hero'},el('div',{},el('h1',{},'Kenali Hukum. Pahami Hak. Jalankan Kewajiban.'),el('p',{},'Jelajahi dunia pembelajaran hukum melalui materi interaktif, tantangan, dan simulasi kehidupan nyata.'),el('div',{class:'row'},el('a',{class:'btn',href:'#/dashboard'},'Mulai Petualangan'),el('a',{class:'btn alt',href:'#/peta'},'Lihat peta'))),avatar('guide')),
el('p',{class:'muted'},'Materi: Pendidikan Pancasila Kelas X, Bab 2 Membangun Budaya Taat Hukum.'),
el('div',{class:'grid'},...[['4 modul','Kesadaran hukum sampai hierarki peraturan'],['Simulasi bercabang','Pilih tindakan, lihat konsekuensinya'],['XP dan badge','Naik level dari Pemula sampai Penjaga Keadilan'],['Progres tersimpan','Disimpan di browser, tanpa akun']].map(([a,b])=>el('div',{class:'card'},el('h3',{},a),el('p',{class:'muted'},b)))));},
dashboard(v){const s=Store.get(),L=Game.level(s.xp);
v.append(el('h2',{},'Halo, Petualang Hukum!'),el('div',{class:'row'},avatar('guide','sm'),el('div',{},el('b',{},'Level '+L.n+': '+L.name),el('div',{class:'muted'},L.next?(L.next-s.xp)+' XP menuju level berikutnya':'Level tertinggi'))),bar(L.pct),
el('div',{class:'grid',style:'margin:16px 0'},stat(s.xp,'Total XP'),stat(Progress.pct()+'%','Progres belajar'),stat(Object.keys(s.sim).length+'/'+SIMS.length,'Simulasi selesai'),stat(Game.modsDone(s)+'/4','Modul selesai')),
bar(Progress.pct()),masteryView(),el('p',{},el('a',{class:'btn',href:nextHref()},'Lanjutkan belajar')),
el('h3',{},'Aktivitas terakhir'),s.log.length?el('ul',{class:'pts'},...s.log.slice(0,6).map(l=>el('li',{},l.m))):el('p',{class:'muted'},'Belum ada aktivitas. Mulai dari Modul 1.'));},
peta(v){v.append(el('h2',{},'Peta Pembelajaran'),guide('Selesaikan materi dan quiz tiap modul untuk membuka modul berikutnya. Modul yang selesai bisa dibuka lagi kapan saja.'));
MODULES.forEach((m,i)=>{const st=Progress.status(i);v.append(el(st==='lock'?'div':'a',{class:'card node '+st,href:'#/m/'+m.id},el('div',{},el('b',{},'Modul '+(i+1)+': '+m.title),el('div',{class:'muted'},m.sub)),el('span',{class:'st '+st},STL[st])));});
const ok=Store.get().awarded.final;v.append(el('a',{class:'card node',href:'#/tantangan'},el('b',{},'Tantangan Akhir'),el('span',{class:'st '+(ok?'done':'')},ok?'Selesai':'Terbuka setelah 4 modul')));},
materi(v){Views.peta(v);v.firstChild.textContent='Materi';},
m(v,id){const i=MODULES.findIndex(x=>x.id===id);if(i<0)return Views.materi(v);if(Progress.status(i)==='lock'){toast('Selesaikan modul sebelumnya dulu.');location.hash='#/peta';return;}
const m=MODULES[i],s=Store.get(),seen=new Set([0]);v.append(el('p',{},el('a',{href:'#/peta'},'Kembali ke peta')),el('h2',{},m.title));
const tabs=el('div',{class:'tabs',role:'tablist'}),body=el('div',{}),fin=el('button',{class:'btn',disabled:''},'Tandai materi selesai (+20 XP)');
const show=k=>{seen.add(k);[...tabs.children].forEach((b,j)=>b.setAttribute('aria-selected',j===k));body.replaceChildren(...readItems(m.tabs[k].i));if(seen.size===m.tabs.length)fin.removeAttribute('disabled');};
m.tabs.forEach((t,k)=>tabs.append(el('button',{class:'tab',role:'tab',onclick:()=>show(k)},t.t)));show(0);
const quizBox=el('div',{class:'card',hidden:''}),refl=el('textarea',{'aria-label':'Jawaban refleksi'});refl.value=s.reflect[m.id]||'';
const quizBtn=el('button',{class:'btn',onclick:()=>{quizBox.hidden=false;runQuiz(QUIZ[m.id],quizBox,p=>saveQuiz(m.id,p,'quiz'+m.id,15,'Mini quiz '+(i+1)));}},'Mulai mini quiz');
fin.addEventListener('click',()=>{s.materi[m.id]=1;Store.save();Game.award('materi'+m.id,20,'Materi selesai');fin.textContent='Materi selesai';fin.disabled=true;});
if(s.materi[m.id]){fin.textContent='Materi selesai';fin.disabled=true;}
v.append(tabs,body,el('p',{},fin),topicsView(m.id),el('h3',{},'Refleksi'),el('p',{},m.reflect),refl,el('p',{},el('button',{class:'btn alt',onclick:()=>{s.reflect[m.id]=refl.value.slice(0,2000);Store.save();toast('Refleksi disimpan');}},'Simpan refleksi')),el('h3',{},'Mini quiz'),el('p',{},quizBtn),quizBox);
if(i<3)v.append(el('p',{},el('a',{class:'btn alt',href:'#/m/'+MODULES[i+1].id},'Modul berikutnya')));},
simulasi(v){v.append(el('h2',{},'Simulasi Kasus'),guide('Tidak ada jawaban tunggal yang sederhana. Pertimbangkan hak, kewajiban, dan dampaknya.'));SIMS.forEach(x=>v.append(el('a',{class:'card node',href:'#/s/'+x.id},el('b',{},x.title),el('span',{class:'st '+(Store.get().sim[x.id]?'done':'')},Store.get().sim[x.id]?'Selesai':'Tersedia'))));},
s(v,id){const c=SIMS.find(x=>x.id===id);if(!c)return Views.simulasi(v);const box=el('div',{});v.append(el('p',{},el('a',{href:'#/simulasi'},'Kembali')),el('h2',{},c.title),guide(c.intro),box);runSim(c,box,(t,mx)=>{doneSim(c,t,mx);box.append(el('a',{class:'btn',href:'#/simulasi'},'Kasus lainnya'));});},
tantangan(v){const s=Store.get();v.append(el('h2',{},'Tantangan Akhir'));if(Game.modsDone(s)<4){v.append(guide('Selesaikan keempat modul dulu untuk membuka tantangan ini.'),el('a',{class:'btn',href:nextHref()},'Lanjutkan belajar'));return;}
const box=el('div',{class:'card'});v.append(el('p',{},'Lima soal campuran dari seluruh modul. +100 XP saat pertama kali selesai.'),box);runQuiz(QUIZ.final,box,p=>saveQuiz('final',p,'final',100,'Tantangan akhir'));},
pencapaian(v){const s=Store.get();v.append(el('h2',{},'Pencapaian'),el('div',{class:'grid'},...BADGES.map(b=>{const on=!!s.awarded['b_'+b.id];return el('div',{class:'card badge'+(on?' on':'')},el('h3',{},b.n),el('p',{class:'muted'},b.d),el('span',{class:'st'+(on?' done':'')},on?'Terbuka':'Terkunci'));})));},
progres(v){const s=Store.get(),L=Game.level(s.xp);v.append(el('h2',{},'Progres Belajar'),el('div',{class:'grid'},stat(s.xp,'Total XP'),stat(L.name,'Level '+L.n),stat(Progress.pct()+'%','Penyelesaian')),bar(Progress.pct()),
masteryView(),el('h3',{},'Nilai quiz'),el('ul',{class:'pts'},...MODULES.map(m=>el('li',{},m.title+': '+(s.quiz[m.id]?s.quiz[m.id].best+' (terbaik)':'belum dikerjakan'))),el('li',{},'Tantangan akhir: '+(s.quiz.final?s.quiz.final.best:'belum dikerjakan'))),
el('h3',{},'Jurnal refleksi'),...journal(),
el('div',{class:'row'},el('button',{class:'btn',onclick:()=>print()},'Cetak ringkasan'),el('a',{class:'btn alt',href:nextHref()},'Lanjutkan materi'),el('button',{class:'btn danger',onclick:()=>{if(confirm('Hapus semua progres? Tindakan ini tidak bisa dibatalkan.')){Store.reset();Game.after();Nav.go();toast('Progres dihapus');}}},'Hapus progres')));}};
Store.get();Nav.init();Game.after();



/* LAW QUEST - konten tambahan (dimuat SETELAH app.js). Sumber: Buku Pendidikan Pancasila Kelas X, Bab 2, hlm. 60-126 + lembar Penggolongan Hukum. */
(()=>{
const T=(id,...tabs)=>MODULES.find(m=>m.id===id).tabs.push(...tabs);
const I=(t,d)=>({t,d});
T('m1',
{t:'Unsur & budaya hukum',i:['Hukum diperlukan untuk mempertahankan kedamaian, menyelesaikan konflik, dan mewujudkan ketertiban (hlm. 65).',
I('4 unsur peraturan hukum','(1) Mengatur tingkah laku manusia; (2) ditetapkan lembaga resmi yang berwenang; (3) bersifat memaksa; (4) ada sanksi bagi pelanggar.'),
I('Budaya hukum','Segala bentuk perilaku budaya manusia yang berkaitan dengan hukum, juga keseluruhan sikap warga dan sistem nilai yang menentukan bagaimana hukum berlaku.'),
I('Ubi societas ibi ius','Ungkapan Cicero (106-43 SM): di mana ada masyarakat, di situ ada hukum. Hukum dibuat untuk manusia, bukan manusia untuk hukum.'),
I('Kesadaran vs kepatuhan','Kesadaran hukum bersifat abstrak (pengetahuan dan nilai). Kepatuhan hukum adalah kesetiaan yang diwujudkan dalam perilaku nyata. Penilaiannya: hukum diketahui, dipahami, ditaati, dan dihargai.')]},
{t:'Asas & fungsi hukum',i:[
I('7 asas pembentukan peraturan yang baik','Kejelasan tujuan; kelembagaan atau pejabat pembentuk yang tepat; kesesuaian jenis, hierarki, dan materi muatan; dapat dilaksanakan; kedayagunaan dan kehasilgunaan; kejelasan rumusan; keterbukaan.'),
I('Fungsi hukum (Rumokoy)','Memberi pengesahan (legitimasi) terhadap yang berlaku; alat rekayasa masyarakat (a tool of social engineering); sarana pembentukan masyarakat khususnya pembangunan; mengatasi konflik. Menurut Budiono Kusumohamidjojo: mencapai ketertiban umum dan keadilan.'),
I('Fiksi hukum','Semua orang dianggap sudah tahu hukum; ketidaktahuan tidak bisa dijadikan alasan lolos dari jeratan hukum. Karena itu pemerintah wajib mensosialisasikan hukum.'),
I('Sumber hukum (Tap MPR III/MPR/2000)','Sumber yang dijadikan bahan penyusunan hukum atau peraturan perundang-undangan; terdiri atas sumber tertulis dan tidak tertulis.')]});
T('m2',
{t:'Sifat norma hukum',i:[
I('4 sifat','Mengikat (berisi perintah dan larangan); memaksa (pelanggar disanksi, ditegakkan alat negara); otonom (independen, tidak boleh diintervensi kecuali demi penegakan hukum dan keadilan); responsif (menjawab tantangan masyarakat dan berorientasi masa depan).'),
I('Norma hukum tertulis di masyarakat','Prosedur membuat KK dan KTP, jadwal siskamling, tamu menginap wajib lapor 1x24 jam, pendirian RT/RW baru.'),
I('Norma etik atau moral','Kesusilaan dan kesopanan yang tidak tertulis: saling membantu saat musibah, menjaga ketenangan, sopan santun, menghormati antarwarga.'),
I('Norma agama dan hukum saling terkait','Pasal 2 ayat (1) UU 1/1974: perkawinan sah bila dilakukan menurut hukum masing-masing agama dan kepercayaannya.')]},
{t:'7 penggolongan hukum',i:[
I('1. Isi','Privat: kepentingan antarindividu (perdata, dagang, perkawinan, waris). Publik: hubungan negara dengan warga untuk kepentingan umum (tata negara, administrasi negara, pidana).'),
I('2. Bentuk','Tertulis: UUD, UU, perpu, PP, perpres, perda. Tidak tertulis: konvensi ketatanegaraan, yurisprudensi, hukum adat.'),
I('3. Sumber','Undang-undang, kebiasaan, traktat, yurisprudensi, doktrin.'),
I('4. Sifat','Memaksa: harus ditegakkan dalam keadaan apa pun (contoh: sanksi pidana). Mengatur: dapat dikesampingkan oleh perjanjian para pihak (contoh: pembagian warisan lewat kesepakatan).'),
I('5. Cara mempertahankan','Materiel: isi larangan dan kebolehan (perdata, pidana, dagang). Formal/acara: cara mempertahankan hukum materiel (KUHAP, hukum acara perdata).'),
I('6. Waktu berlaku','Ius constitutum (hukum positif): berlaku sekarang, contoh UU 22/2009 tentang LLAJ. Ius constituendum: hukum yang diharapkan berlaku di masa depan.'),
I('7. Tempat berlaku','Nasional (UUD, UU, PP); hukum negara lain (Singapura, Malaysia); internasional (traktat, konvensi PBB, perjanjian bilateral).')]},
{t:'Taat hukum per lingkungan',i:[
I('Keluarga','Menghormati anggota keluarga, meminta izin bepergian, menyelesaikan masalah secara kekeluargaan, menjaga barang di rumah.'),
I('Sekolah','Tidak terlambat, tidak menyontek, berseragam sesuai tata tertib.'),
I('Masyarakat','Tidak menyebarkan hoaks, menjaga hubungan baik dengan tetangga, ikut gerakan antinarkoba.'),
I('Bangsa dan negara','Memiliki KK dan KTP, membayar pajak, menggunakan hak pilih dan ikut kampanye pemilu yang bersih dan jujur.')]},
{t:'5 cara wujudkan keadilan',i:[
I('a. Keadilan sebagai tujuan pembangunan','Cita-cita Alinea II Pembukaan: Indonesia merdeka, bersatu, berdaulat, adil, dan makmur. Pemerataan menjauhkan pemerintah dari ketidakpuasan rakyat.'),
I('b. Equity, bukan semata equality','Hak diberikan proporsional sesuai kebutuhan dan kepantasan, dengan mengutamakan kemanusiaan (contoh uang saku kakak dan adik).'),
I('c. Kesatuan paham kebangsaan','Mempersatukan bukan menyeragamkan. Sukarno, 1 Juni 1945: negara semua buat semua, bukan untuk satu orang atau golongan.'),
I('d. Musyawarah mufakat','Semua peserta setara dan diperlakukan adil; aspirasi disampaikan santun, tidak emosional, tidak anarkis.'),
I('e. Keselarasan hak dan kewajiban','Warga berhak atas hak dasar dan wajib menghormati hak orang lain serta ikut membangun.')]});
T('m3',
{t:'4 alasan & Pasal 27-34',i:[
I('Mengapa hak dan kewajiban harus seimbang?','Menghindarkan sikap egois; menumbuhkan toleran; sadar sebagai bagian masyarakat dan bangsa; bijak menggunakan kekuasaan (setiap orang adalah pemimpin).'),
I('Contoh keselarasan','Setelah bekerja (kewajiban), seseorang berhak atas upah sesuai perjanjian. Hak dasar: pendidikan, kesehatan, pekerjaan, tempat tinggal layak. Kewajiban: menghormati hak orang lain dan ikut pembangunan.'),
I('Pasal 27-34 UUD NRI 1945','Mengatur hak dan kewajiban warga negara. Pasal 27 ayat (1) menjamin kedudukan yang sama di dalam hukum dan pemerintahan.')]},
{t:'Global, teknologi & kasus',i:[
I('Landasan konstitusional','Alinea IV Pembukaan: ikut melaksanakan ketertiban dunia berdasarkan kemerdekaan, perdamaian abadi, dan keadilan sosial. Pidato Sukarno To Build the World a New di PBB (30 September 1960) memperkenalkan Pancasila sebagai nilai universal.'),
I('Teknologi, pedang bermata dua','Mengakses konten adalah hak, tetapi tidak boleh merugikan hak orang lain. Perlu karakter dan kecerdasan menyaring budaya asing yang belum tentu sesuai Pancasila.'),
I('Cara cerdas menangkal hoaks','Cek kebenaran sebelum menyebarkan; waspada judul provokatif; cermati alamat situs; periksa fakta dan sumber; teliti keaslian foto; ikut grup anti-hoaks; adukan ke pihak berwenang.'),
I('Tiga kasus diskusi buku','Berisik di malam hari (hak tetangga atas ketenangan vs hobi bermusik); konten dan lagu populer (jangan asal viral); korupsi kecil di sekolah (menyontek, tidak mengembalikan sisa uang, meminjam uang kas).')]});
T('m4',
{t:'Wewenang & muatan',i:[
I('UUD NRI 1945','Ditetapkan PPKI 18 Agustus 1945; perubahan oleh MPR. Muatan: jaminan HAM, hak dan kewajiban warga, dasar dan bentuk negara, tujuan bernegara.'),
I('Ketetapan MPR','Ditetapkan MPR. Yang dimaksud hanya Tap MPRS dan Tap MPR yang masih berlaku menurut Tap MPR 1/MPR/2003.'),
I('UU dan Perppu','UU: disetujui bersama DPR dan Presiden, disahkan Presiden. Muatan: pengaturan lebih lanjut UUD, perintah UU, pengesahan perjanjian internasional tertentu, pemenuhan kebutuhan hukum. Perppu: ditetapkan Presiden dalam kegentingan memaksa; muatannya sama dengan UU.'),
I('PP dan Perpres','PP: ditetapkan Presiden untuk menjalankan UU. Perpres: ditetapkan Presiden untuk menjalankan perintah aturan lebih tinggi atau penyelenggaraan pemerintahan.'),
I('Perda Provinsi dan Kab/Kota','Disetujui bersama DPRD dan kepala daerah. Muatan: otonomi daerah, tugas pembantuan, kondisi khusus daerah, dan penjabaran aturan yang lebih tinggi.')]},
{t:'Di luar hierarki',i:['Diakui dan mengikat sepanjang diperintahkan peraturan yang lebih tinggi atau dibentuk berdasarkan kewenangan.',
I('Penetapnya','MPR, DPR, DPD, MA, MK, BPK, Komisi Yudisial, Bank Indonesia, Menteri, badan atau komisi setingkat yang dibentuk dengan UU, DPRD, Gubernur, Bupati/Walikota, kepala desa.'),
I('Contoh','Peraturan DPR, peraturan menteri, peraturan kepala daerah, peraturan desa.'),
I('Produk hukum responsif','Mencerminkan rasa keadilan dan harapan masyarakat; prosesnya membuka partisipasi (kunjungan wakil rakyat, dialog lisan, titip aspirasi tertulis).')]},
{t:'Kelsen & Pancasila',i:[
I('Stufenbau des recht','Teori Hans Kelsen: legalitas peraturan dilihat dari hierarkinya. Aturan lebih rendah bersumber dari yang lebih tinggi dan isinya tidak boleh bertentangan.'),
I('Hubungan formal dan materiel','Formal: rumusan Pancasila tercantum di Pembukaan UUD (Alinea IV). Materiel: seluruh pokok kaidah Pembukaan bersumber dari Pancasila.'),
I('Sejarah singkat','Pancasila diusulkan lebih dulu di sidang BPUPK; PPKI lalu menetapkan Pembukaan UUD. Pada 18 Agustus 1945 sila pertama Piagam Jakarta diubah menjadi Ketuhanan Yang Maha Esa.'),
I('Pancasila sebagai sumber segala sumber hukum','(1) Ideologi negara yang nilainya menjiwai semua peraturan; (2) asas dan pedoman membuat peraturan. Dasar: Tap MPR III/MPR/2000 Pasal 1 ayat (3) dan UU 12/2011.')]},
{t:'Menguji peraturan',i:[
I('3 syarat isi peraturan','Searah dan mendukung aturan di atasnya; dapat dilaksanakan dan memberi kepastian; selaras dengan kepentingan rakyat, keadilan, dan tidak membuka peluang korupsi.'),
I('Judicial review','UU terhadap UUD: Mahkamah Konstitusi. Peraturan di bawah UU terhadap UU: Mahkamah Agung.'),
I('Harmonisasi vs sinkronisasi','Harmonisasi: pengkajian rancangan agar selaras dengan peraturan, hukum tidak tertulis, dan perjanjian internasional yang diratifikasi. Sinkronisasi: penyelarasan agar tidak tumpang tindih, vertikal (dengan aturan di atasnya) dan horizontal (dengan aturan sederajat).')]});

/* ===== Bank soal. lv: LOTS (C1-C2), MOTS (C3), HOTS (C4-C6). a = indeks kunci ===== */
const P=(lv,c,q,o,a,e)=>({lv,c,q,o,a,e});
const BANK=[
P('LOTS','C1','Berikut yang BUKAN unsur peraturan hukum adalah...',['Mengatur tingkah laku manusia','Ditetapkan lembaga yang berwenang','Bersifat memaksa','Bersifat sukarela tanpa sanksi'],3,'Unsur hukum: mengatur tingkah laku, ditetapkan lembaga berwenang, memaksa, dan ada sanksi.'),
P('LOTS','C1','Ungkapan Cicero ubi societas ibi ius berarti...',['hukum dibuat untuk penguasa','di mana ada masyarakat di situ ada hukum','hukum lebih tinggi dari moral','ketidaktahuan hukum dimaafkan'],1,'Ubi societas ibi ius: di mana ada masyarakat, di situ ada hukum.'),
P('LOTS','C1','Urutan hierarki yang benar setelah UUD NRI 1945 adalah...',['UU/Perppu, Tap MPR, PP, Perpres','Tap MPR, PP, UU/Perppu, Perpres','Tap MPR, UU/Perppu, PP, Perpres, Perda Provinsi, Perda Kab/Kota','Perpres, PP, UU/Perppu, Tap MPR'],2,'Pasal 7 ayat (1) UU 12/2011 jo. UU 13/2022.'),
P('LOTS','C1','Pasal 27 ayat (1) UUD NRI 1945 menegaskan...',['kebebasan beragama','persamaan kedudukan warga negara dalam hukum dan pemerintahan','hak atas pendidikan','kedaulatan di tangan rakyat'],1,'Segala warga negara bersamaan kedudukannya di dalam hukum dan pemerintahan.'),
P('LOTS','C1','KUHAP yang mengatur cara menegakkan hukum pidana termasuk hukum...',['materiel','acara (formal)','privat','internasional'],1,'Hukum acara/formal mengatur cara mempertahankan hukum materiel.'),
P('LOTS','C2','Hukum disebut bersifat responsif karena...',['dapat dikesampingkan oleh perjanjian','berfungsi menjawab tantangan hukum yang akan dihadapi masyarakat','tidak boleh diintervensi kepentingan lain','berlaku di seluruh dunia'],1,'Responsif: hukum sebagai fasilitator yang berorientasi masa depan. Otonom adalah yang tidak boleh diintervensi.'),
P('LOTS','C2','Pelaksanaan hak dan kewajiban yang SELARAS artinya...',['tidak bertentangan dengan norma dan hukum yang berlaku','jumlah hak dan kewajiban harus sama','hak dilaksanakan lebih dulu','kewajiban hanya milik aparat'],0,'Selaras: tidak bertentangan dengan norma dan hukum. Serasi: harmonis antara hak dan kewajiban. Seimbang: berimbang antara keduanya.'),
P('MOTS','C3','Warga yang berbeda agama membantu menyediakan lahan parkir bagi jemaah rumah ibadah di dekat rumahnya. Sikap ini mencerminkan...',['toleransi yang mewujudkan keadilan','ketaatan karena terpaksa','sikap eksklusif','penyalahgunaan kekuasaan'],0,'Contoh penerapan perilaku di buku hlm. 85.'),
P('MOTS','C3','Sebuah PP dinilai bertentangan dengan UU. Pengujian dapat diajukan ke...',['Mahkamah Konstitusi','Mahkamah Agung','DPR','Presiden'],1,'Peraturan di bawah UU diuji ke MA; UU terhadap UUD diuji ke MK.'),
P('MOTS','C3','UU A (umum) mengatur penipuan; UU B (sama tingkat) khusus mengatur penipuan di sektor perbankan. Untuk kasus perbankan berlaku...',['lex specialis derogat legi generali','lex posteriori derogat legi priori','lex superiori derogat legi inferiori','aturan yang paling panjang'],0,'Sederajat dan materi sama: aturan khusus mengesampingkan yang umum.'),
P('MOTS','C3','UU lama dan UU baru sederajat mengatur hal yang sama dan bertentangan. Aturan yang dipakai adalah...',['UU lama','UU baru','Keduanya berlaku bersamaan','Perda'],1,'Lex posteriori derogat legi priori, untuk mencegah ketidakpastian hukum.'),
P('MOTS','C3','Anita berhenti di lampu merah pada malam sepi tanpa polisi karena paham itu melindungi keselamatan. Jenis ketaatannya...',['terpaksa','identifikasi','kesadaran diri','tidak ada'],2,'Ia menaati karena nilai aturan, bukan karena diawasi atau takut sanksi.'),
P('MOTS','C3','Kamu menerima pesan berantai bernada provokatif tanpa sumber jelas. Tindakan yang tepat...',['meneruskan agar orang waspada','memeriksa fakta dan sumber, lalu melaporkan bila palsu','membalas dengan emosi','mengabaikan sambil menyimpannya'],1,'Cek kebenaran, periksa sumber, adukan ke pihak berwenang.'),
P('HOTS','C4','Pejabat memotong antrean dengan alasan saya orang penting. Faktor penyebab pelanggaran hak yang paling tepat dan prinsip hukum yang dilanggar adalah...',['egois; kepastian','merasa eksklusif; keadilan tanpa diskriminasi','kurang kesadaran; kemanfaatan','penyalahgunaan teknologi; otonom'],1,'Jabatan membuatnya merasa spesial (eksklusif). Hukum berlaku bagi semua tanpa diskriminasi.'),
P('HOTS','C4','Ciri: banyak pelanggaran, warga tidak percaya aparat, penegakan hukum pilih kasih. Simpulan paling tepat...',['kesadaran hukum masyarakat rendah','kesadaran hukum tinggi','hukum sudah efektif','budaya hukum ideal'],0,'Kebalikan dari lima ciri kesadaran hukum tinggi di buku.'),
P('HOTS','C4','Warga menilai satu UU bertentangan dengan UUD dan satu Perda bertentangan dengan UU. Jalur yang benar...',['keduanya ke MA','keduanya ke MK','UU ke MK, Perda ke MA','UU ke MA, Perda ke MK'],2,'MK menguji UU terhadap UUD; MA menguji aturan di bawah UU terhadap UU.'),
P('HOTS','C4','Pancasila adalah roh dan UUD adalah raga. Konsekuensi yuridis yang benar...',['pasal UUD boleh berbeda dari nilai Pancasila','Pembukaan UUD bersumber dari Pancasila sehingga aturan di bawahnya tidak boleh bertentangan dengan keduanya','Pancasila dapat diubah lewat amandemen','Pancasila berada di bawah UUD'],1,'Hubungan formal dan materiel; kedudukan Pancasila tetap dan kuat.'),
P('HOTS','C5','Perda menyatakan pemeluk agama tertentu dilarang membangun rumah ibadah. Penilaian yang tepat...',['sah karena Perda dibuat DPRD','bertentangan dengan sila pertama dan Pasal 29 UUD sehingga dapat diuji ke MA','sah karena demi ketertiban','hanya MK yang berwenang'],1,'Aturan bawahan tidak boleh melarang kebebasan beragama yang dijamin Pasal 29 ayat (1) dan (2). Perda diuji ke MA.'),
P('HOTS','C5','Sekolah membagi bantuan seragam sama rata untuk semua, termasuk siswa mampu, sehingga siswa kurang mampu tetap kekurangan. Evaluasi tepat...',['sudah adil karena sama','kurang tepat: keadilan proporsional sesuai kebutuhan (equity)','benar karena kemanfaatan','benar karena kepastian'],1,'Adil bukan sama rata, tetapi proporsional.'),
P('HOTS','C5','Pabrik membuang limbah ke sungai demi untung. Solusi paling tepat dan beralasan...',['dibiarkan karena membuka lapangan kerja','mewajibkan pengelolaan limbah dan menegakkan sanksi karena warga berhak atas lingkungan bersih','meminta warga pindah','menutup semua pabrik'],1,'Teknologi pedang bermata dua; pencemaran mengganggu hak warga atas lingkungan yang bersih dan nyaman.')];
window.LQ={BANK};
const ES=[
{lv:'LOTS',c:'C1',q:'Tuliskan jenis dan hierarki peraturan perundang-undangan di Indonesia secara berurutan!',k:['UUD NRI 1945','Ketetapan MPR','UU/Perppu','Peraturan Pemerintah','Peraturan Presiden','Perda Provinsi','Perda Kabupaten/Kota']},
{lv:'LOTS',c:'C2',q:'Jelaskan tiga jenis ketaatan hukum dan beri satu contoh untuk tiap jenis!',k:['Terpaksa: takut sanksi, butuh pengawasan (contoh: tertib karena ada petugas)','Identifikasi: menjaga hubungan baik dengan pihak lain','Kesadaran diri: sesuai nilai yang dianut; inilah yang diharapkan']},
{lv:'MOTS',c:'C3',q:'Kamu menerima kabar belum jelas kebenarannya (hoaks) di media sosial. Jelaskan sikap dan langkahmu, kaitkan dengan hak dan kewajiban!',k:['Tidak asal menyebarkan','Cek kebenaran, sumber, dan keaslian foto','Waspada judul provokatif','Adukan ke pihak berwenang','Kaitkan: hoaks melanggar hak orang atas ketenangan; menyaring informasi adalah kewajiban']},
{lv:'HOTS',c:'C4',q:'Analisis kaitan asas lex superiori derogat legi inferiori dengan harmonisasi peraturan perundang-undangan!',k:['Aturan rendah tidak boleh bertentangan dengan yang tinggi','Harmonisasi mengkaji rancangan agar selaras dengan aturan di atasnya','Mencegah disharmonisasi dan menjamin kepastian hukum','Jika tetap bertentangan: judicial review (MK untuk UU, MA untuk aturan di bawah UU)']},
{lv:'HOTS',c:'C6',q:'Rancang 3 pasal tata tertib sekolah (misalnya kebersihan atau ponsel) yang memenuhi kepastian, keadilan, dan kemanfaatan, tidak bertentangan dengan aturan di atasnya, dan melibatkan siswa dalam penyusunannya!',k:['Rumusan jelas, tegas, tidak multitafsir (kepastian)','Berlaku sama untuk semua dengan sanksi proporsional (keadilan)','Tujuan dan manfaat jelas bagi warga sekolah','Tidak bertentangan dengan UU, PP, atau aturan dinas pendidikan','Ada partisipasi: dengar pendapat, wakil siswa, musyawarah mufakat']}];

const mix=x=>{if(x.o.some(t=>/^(semua|\d)/i.test(t)))return x;const c=x.o.map((t,i)=>[t,i===x.a]);for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]];}return{...x,o:c.map(z=>z[0]),a:c.findIndex(z=>z[1])};};
Views.latihan=v=>{const s=Store.get();let lv='Semua';
const L=['Semua','LOTS','MOTS','HOTS'],tabs=el('div',{class:'tabs',role:'tablist'}),info=el('p',{class:'muted'}),box=el('div',{class:'card',hidden:''});
const list=()=>BANK.filter(x=>lv==='Semua'||x.lv===lv);
const draw=()=>{[...tabs.children].forEach((b,j)=>b.setAttribute('aria-selected',String(L[j]===lv)));info.textContent=list().length+' soal pilihan ganda. LOTS = mengingat dan memahami (C1-C2), MOTS = menerapkan (C3), HOTS = menganalisis, mengevaluasi, mencipta (C4-C6).';box.hidden=true;};
L.forEach(x=>tabs.append(el('button',{class:'tab',role:'tab',onclick:()=>{lv=x;draw();}},x)));
v.append(el('h2',{},'Latihan Soal'),guide('Soal disusun bertingkat seperti kisi-kisi ujian. Kerjakan LOTS dulu, lalu MOTS, lalu HOTS.'),tabs,info,
el('p',{},el('button',{class:'btn',onclick:()=>{box.hidden=false;const k=lv;runQuiz(list().map(x=>({...mix(x),q:'['+x.lv+' '+x.c+'] '+x.q})),box,p=>saveQuiz('lat'+k,p,'lat'+k,30,'Latihan '+k));}},'Mulai latihan')),box,
el('h3',{},'Soal esai'),el('p',{class:'muted'},'Tulis jawabanmu dulu, lalu buka kunci dan rubrik untuk menilai diri.'));
draw();ES.forEach((x,n)=>{const key='es'+n,ta=el('textarea',{'aria-label':'Jawaban esai '+(n+1)}),kunci=el('div',{class:'fb',hidden:''},el('b',{},'Poin yang perlu ada (1 poin tiap butir):'),el('ul',{class:'pts'},...x.k.map(t=>el('li',{},t))));ta.value=s.reflect[key]||'';
v.append(el('div',{class:'card',style:'margin:12px 0'},el('span',{class:'chip'},x.lv+' '+x.c),el('h3',{},(n+1)+'. '+x.q),ta,el('p',{},el('button',{class:'btn alt',onclick:()=>{if(ta.value.trim().length<20){toast('Tulis jawabanmu dulu (min. 20 karakter).');return;}s.reflect[key]=ta.value.slice(0,2000);Store.save();kunci.hidden=false;Game.award('es'+n,15,'Esai '+(n+1));}},'Simpan dan lihat kunci')),kunci));});};
const n=document.getElementById('nav');n.insertBefore(el('a',{href:'#/latihan','data-k':'latihan'},'Latihan Soal'),n.children[6]);
})();


/* ===== materi-pendalaman ===== */
/* Pendalaman Bab 2: peta cabang hukum, norma vs hukum, membaca peraturan, konflik antarperaturan, istilah tertukar.
   Sumber: rangkuman Bab 2 (buku hlm. 60-126 + PPT) dan analisis kebutuhan pendalaman. Contoh bernomor = ilustrasi penyusun, bukan dari buku. */
(()=>{
const T=(id,...tabs)=>MODULES.find(m=>m.id===id).tabs.push(...tabs);
const I=(t,d)=>({t,d}),H=h=>({h}),TB=(c,h,r)=>({tb:{c,h,r}}),FL=(...fl)=>({fl});

/* ---------- Modul 1 ---------- */
T('m1',
{t:'Peta Bab 2',i:['Gambaran besar Bab 2 Membangun Budaya Taat Hukum, supaya kamu tahu arah belajarmu.',
I('5 tujuan pembelajaran','(1) Menunjukkan perilaku taat hukum; (2) menganalisis perilaku taat dan melanggar hukum; (3) menganalisis dampak pelanggaran hak dan pengingkaran kewajiban yang bertentangan dengan UUD NRI 1945; (4) menganalisis hierarki peraturan perundang-undangan; (5) menganalisis hubungan Pancasila dengan peraturan perundang-undangan.'),
'Alur materi:',FL('Kesadaran hukum','Menerapkan perilaku taat hukum (norma, penggolongan hukum, jenis ketaatan)','Kasus pelanggaran hak dan pengingkaran kewajiban','Produk dan hierarki peraturan','Harmonisasi dan sinkronisasi','Hubungan Pancasila dengan peraturan'),
I('Kata kunci','Disiplin, hak dan kewajiban, harmonisasi hukum, hierarki, norma, pelanggaran hak, pengingkaran kewajiban, produk hukum, sinkronisasi hukum, taat hukum.'),
I('Dasar konstitusional utama','Pasal 1 ayat (3) UUD NRI 1945: Negara Indonesia adalah negara hukum. Artinya segala tatanan hidup bermasyarakat, berbangsa, dan bernegara didasarkan pada hukum yang berlaku. Turunannya: berdasarkan hukum, memiliki aturan yang jelas, menjamin kepastian dan keadilan.')]},
{t:'Ciri, sifat & unsur hukum',i:['Hukum adalah sistem peraturan atau norma tertulis maupun tidak tertulis yang dibuat badan berwenang, bersifat memaksa, dengan sanksi tegas bagi pelanggar. Hukum dibuat untuk manusia, bukan manusia untuk hukum. (Bagian ini dari PPT.)',
TB('Tiga istilah yang sering tertukar',['Istilah','Pertanyaan yang dijawab','Isinya'],[
['Ciri','Karakteristik apa yang menunjukkan suatu aturan adalah hukum?','Mengatur perilaku manusia; memaksa; memiliki sanksi; dibuat pihak berwenang; bertujuan menciptakan ketertiban dan keadilan'],
['Sifat','Bagaimana hukum berlaku terhadap masyarakat?','Mengatur (regulatif: boleh, wajib, dilarang); memaksa (imperatif: dilanggar dikenai sanksi); melindungi hak dan kepentingan masyarakat'],
['Unsur','Apa yang membentuk hukum?','Subjek hukum, objek hukum, peristiwa hukum, hubungan hukum']]),
I('Subjek hukum','Pendukung hak dan kewajiban: individu, masyarakat, badan hukum, negara.'),
I('Objek hukum','Sesuatu yang menjadi sasaran hubungan hukum: benda, perbuatan, peristiwa.'),
I('Peristiwa hukum','Kejadian yang menimbulkan hak dan kewajiban. Contoh: jual beli sepeda menimbulkan kewajiban membayar dan menyerahkan barang.'),
I('Hubungan hukum','Hubungan antara subjek dan objek yang diatur oleh hukum.')]},
{t:'Sumber materiil & formil',i:['Menurut Tap MPR III/MPR/2000, sumber hukum adalah sumber yang dijadikan bahan penyusunan hukum atau peraturan perundang-undangan. Pancasila adalah sumber dari segala sumber hukum.',
TB('Dua cara melihat sumber hukum',['Jenis','Maknanya','Contoh'],[
['Sumber materiil','Bahan isi atau nilai yang membentuk hukum','Pancasila, kondisi sosial dan ekonomi, nilai agama dan moral, sejarah dan geografis, kesusilaan dan kesadaran hukum'],
['Sumber formil','Bentuk tempat hukum dapat ditemukan','Undang-undang, kebiasaan atau konvensi, traktat atau perjanjian internasional, yurisprudensi, doktrin (pendapat pakar)']]),
TB('Sumber tertulis dan tidak tertulis',['Jenis','Keterangan'],[
['Tertulis','Tercantum dalam peraturan negara, terlihat pada tata urutan Pasal 7 ayat (1) UU 12/2011 jo. UU 13/2022. Peraturan di atas menjadi sumber bagi yang di bawah; peraturan sejajar menjadi acuan agar sinkron dan harmonis.'],
['Tidak tertulis','Hukum yang hidup di masyarakat, misalnya adat dan kebiasaan positif yang sudah melembaga.']]),
H('Hukum dan peraturan perundang-undangan berbeda'),
'Hukum adalah konsep yang lebih luas. Peraturan perundang-undangan hanyalah salah satu bentuk hukum tertulis, yaitu yang dibuat lembaga berwenang melalui prosedur tertentu.',
I('Tidak semua hukum berbentuk UU','Ada hukum adat, kebiasaan, yurisprudensi, traktat, dan doktrin. Semuanya hukum atau sumber hukum, tetapi bukan peraturan perundang-undangan.')]},
{t:'Norma: tabel & satu kasus',i:['Hukum adalah bagian dari norma, dan keduanya berlandaskan Pancasila. Maka semua hukum adalah norma, tetapi tidak semua norma adalah hukum.',
TB('Empat jenis norma',['Norma','Sumber','Sanksi','Contoh'],[
['Agama','Ajaran agama, kitab suci','Keagamaan atau moral','Menjalankan ibadah, menghormati ajaran agama'],
['Kesusilaan','Hati nurani','Rasa bersalah','Berkata jujur, membantu orang yang membutuhkan'],
['Kesopanan','Adat dan tata pergaulan antarwarga','Teguran sosial','Menghormati yang lebih tua, berbicara sopan'],
['Hukum','Hukum yang berlaku (negara)','Sanksi hukum, ditegakkan alat negara','Menaati rambu lalu lintas, membayar pajak']]),
H('Satu kasus dilihat dari empat norma'),
'Kasus: seseorang mengambil barang milik temannya tanpa izin.',
I('Norma agama','Dilarang mengambil hak orang lain.'),
I('Norma kesusilaan','Dianggap tidak jujur; hati nurani terusik.'),
I('Norma kesopanan','Dianggap tidak menghargai orang lain.'),
I('Norma hukum','Dapat menjadi tindak pidana apabila memenuhi unsur-unsur yang ditentukan hukum.'),
'Pelajaran: hukum bukan sekadar aturan yang ada di buku. Satu perbuatan bisa melanggar beberapa norma sekaligus.']});

/* ---------- Modul 2 ---------- */
T('m2',
{t:'Peta cabang hukum',i:['Penggolongan hukum bersifat klasifikasi. Supaya berguna, kenali juga cabang-cabangnya beserta contoh kasus.',
TB('Cabang hukum',['Cabang','Mengatur apa?','Contoh sederhana','Golongan'],[
['Hukum Tata Negara','Struktur dan kekuasaan negara','Presiden, DPR, MPR','Publik'],
['Hukum Administrasi Negara','Tindakan atau administrasi pemerintahan','Izin usaha, keputusan pejabat','Publik'],
['Hukum Pidana','Perbuatan yang dilarang beserta sanksinya','Pencurian, penganiayaan','Publik'],
['Hukum Acara','Cara menyelesaikan perkara dan mempertahankan hukum materiel','Proses persidangan, KUHAP','Publik'],
['Hukum Perdata','Hubungan hukum antarorang','Utang, jual beli, wanprestasi, waris','Privat'],
['Hukum Dagang','Kegiatan perdagangan antarpihak','Perjanjian usaha','Privat'],
['Hukum Internasional','Hubungan antarnegara atau subjek internasional','Perjanjian antarnegara','Publik (perdata internasional: privat)']]),
H('Kasus: masuk cabang hukum apa?'),
I('Seseorang mencuri sepeda motor','Hukum pidana. Perbuatan dilarang, ada sanksi, dan negara melalui jaksa menuntut perkara di pengadilan.'),
I('Seseorang digugat karena wanprestasi','Hukum perdata. Salah satu pihak tidak memenuhi isi perjanjian; pihak yang dirugikan menggugat.'),
I('Warga menggugat keputusan pejabat pemerintah','Hukum administrasi negara, karena yang dipersoalkan adalah tindakan atau keputusan dalam administrasi pemerintahan.'),
I('Dua negara menandatangani perjanjian','Hukum internasional: hubungan antarnegara.'),
I('Pidana vs perdata','Pidana melindungi kepentingan umum dan menjatuhkan hukuman. Perdata menyelesaikan sengketa pribadi, biasanya berupa pemenuhan perjanjian atau ganti rugi. Satu peristiwa kadang menyentuh keduanya.')]},
{t:'Pelanggaran norma vs hukum',i:['Tidak semua perilaku buruk otomatis menjadi pelanggaran hukum atau tindak pidana. Ukurannya: apakah ada aturan hukum yang melarang dan menetapkan sanksinya.',
I('Tidak menyapa tetangga','Dapat dianggap tidak sopan (norma kesopanan), tetapi belum tentu pelanggaran hukum.'),
I('Mencuri sepeda motor','Melanggar norma agama, kesusilaan, dan kesopanan, sekaligus dapat menjadi pelanggaran hukum.'),
I('Membuang sampah sembarangan','Awalnya soal kesopanan dan kepedulian. Menjadi persoalan hukum jika ada aturan (misalnya perda) yang melarang dan memberi sanksi.'),
I('Berbohong kepada teman','Melanggar kesusilaan. Menjadi hukum bila memenuhi unsur perbuatan yang dilarang aturan, misalnya penipuan.'),
'Fiksi hukum tetap berlaku: karena semua orang dianggap tahu hukum, ketidaktahuan tidak menghapus tanggung jawab.']},
{t:'3 jenis ketaatan (tabel)',i:[TB('Ketaatan hukum menurut Kelman dan Pospisil',['Jenis','Motivasi','Catatan','Contoh'],[
['Terpaksa','Takut hukuman atau sanksi','Perlu pengawasan rutin','Tertib hanya saat ada petugas'],
['Identifikasi (mengikuti)','Khawatir hubungan baik dengan pihak lain terganggu','Bergantung pada kelompok','Ikut tidak membuang sampah karena semua teman begitu'],
['Kesadaran diri','Hukum dirasa sesuai nilai yang dianut','Yang diharapkan','Berseragam rapi walau tanpa pengawasan']]),
'Perilaku taat hukum sering disebut disiplin, meskipun disiplin lebih luas. Ciri taat hukum: memahami pentingnya hukum; tidak merugikan diri dan orang lain; menjaga perasaan orang lain; aktif menjalankan perintah dan meninggalkan larangan.']});

/* ---------- Modul 3 ---------- */
T('m3',
{t:'Latihan analisis kasus',i:['Untuk tiap kasus, tentukan faktor penyebab dan hak yang terganggu. Buka kuncinya setelah mencoba.',
I('Kasus 1: Rani menuntut hak, abai piket','Faktor: sikap egois. Rani menuntut hak sebagai anggota tim, tetapi mengabaikan kewajiban piket sehingga hak anggota lain dirugikan.'),
I('Kasus 2: Anak pejabat melanggar aturan parkir','Faktor: merasa eksklusif. Jabatan, pangkat, kekayaan, atau kerabat membuat seseorang merasa spesial dan bertindak semaunya. Prinsip dilanggar: Pasal 27 ayat (1), kedudukan yang sama di dalam hukum.'),
I('Kasus 3: Limbah pabrik dibuang ke sungai','Faktor: penyalahgunaan teknologi (pedang bermata dua). Hak warga atas lingkungan bersih dan nyaman terganggu. Solusi: wajibkan pengelolaan limbah dan tegakkan sanksi.'),
I('Kasus 4: Menyebar kabar belum jelas','Faktor: kurangnya kesadaran. Hoaks mengganggu hak orang atas ketenangan. Langkah benar: cek sumber dan keaslian foto sebelum menyebarkan, laporkan ke pihak berwenang.'),
I('Seimbang, serasi, selaras','Seimbang = berimbang antara hak dan kewajiban. Serasi = harmonis antara hak dan kewajiban. Selaras = tidak bertentangan dengan norma dan hukum.')]});

/* ---------- Modul 4 ---------- */
T('m4',
{t:'Contoh nyata tiap jenis',i:['Agar hierarki tidak sekadar hafalan, kenali fungsi dan contoh tiap jenis. Contoh bernomor adalah ilustrasi dari penyusun, bukan dari buku; cek naskah resminya di jdih.go.id.',
TB('Jenis peraturan dan contohnya',['Jenis','Contoh','Untuk apa?'],[
['UUD NRI 1945','UUD NRI Tahun 1945','Dasar konstitusional negara'],
['Ketetapan MPR','Tap MPR No. 1/MPR/2003','Tap yang masih berlaku ditentukan lewat peninjauan Tap MPRS dan Tap MPR'],
['UU','UU No. 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan','Mengatur suatu bidang secara lebih rinci dari UUD'],
['Perppu','Dibuat hanya saat kegentingan memaksa','Muatan sama dengan UU, sementara belum ada UU'],
['PP','PP No. 79 Tahun 2013 tentang Jaringan Lalu Lintas dan Angkutan Jalan','Menjalankan UU sebagaimana mestinya'],
['Perpres','Perpres No. 82 Tahun 2018 tentang Jaminan Kesehatan','Menjalankan perintah aturan lebih tinggi atau penyelenggaraan pemerintahan'],
['Perda Provinsi','Perda Provinsi DKI Jakarta No. 3 Tahun 2013 tentang Pengelolaan Sampah','Mengatur urusan daerah provinsi'],
['Perda Kab/Kota','Perda kota atau kabupatenmu tentang ketertiban umum atau retribusi','Mengatur urusan daerah kabupaten atau kota']]),
H('Tiga pertanyaan yang harus bisa kamu jawab'),
I('Mengapa PP dibuat?','Karena UU biasanya memuat pokok-pokok. PP menjabarkan cara menjalankannya. Makin rendah aturan, makin detail dan operasional.'),
I('Apa hubungan PP dengan UU?','PP bersumber dari UU dan tidak boleh menyimpang darinya.'),
I('Apa yang terjadi bila isinya bertentangan?','Aturan rendah yang bertentangan dengan aturan tinggi dikesampingkan (lex superiori) dan dapat diuji ke lembaga berwenang.')]},
{t:'Membaca identitas & pasal',i:[H('Identitas peraturan'),
'Contoh: Undang-Undang Republik Indonesia Nomor 12 Tahun 2011 tentang Pembentukan Peraturan Perundang-undangan.',
TB('Membedah identitas',['Bagian','Artinya'],[
['Undang-Undang','Jenis peraturan'],['Republik Indonesia','Negara pembentuk'],['Nomor 12','Nomor urut peraturan jenis itu pada tahun tersebut'],['Tahun 2011','Tahun ditetapkan'],['tentang ...','Materi yang diatur']]),
'Bandingkan polanya: Peraturan Pemerintah Nomor 35 Tahun 2021 tentang ...; Peraturan Presiden Nomor ... Tahun ... tentang ...; Peraturan Daerah Provinsi ... Nomor ... Tahun ... tentang ... Nomor bukan tanda tingkat kepentingan; yang menentukan kedudukan adalah jenisnya.',
H('Cara membaca rujukan pasal'),
TB('Contoh rujukan',['Rujukan','Cara membaca'],[
['Pasal 28J ayat (1) UUD NRI 1945','Pasal 28J, ayat (1)'],
['Pasal 7 ayat (1) huruf c UU No. 12 Tahun 2011','Pasal 7, ayat (1), huruf c: UU atau Perppu dalam jenis dan hierarki'],
['Pasal 27 ayat (1) UUD NRI 1945','Pasal 27, ayat (1): kedudukan sama di dalam hukum dan pemerintahan']]),
I('Urutan satuan isi','Bab, bagian, paragraf, pasal; pasal dirinci menjadi ayat bernomor Arab dalam kurung, ayat dirinci menjadi huruf (a, b, c), huruf dapat dirinci menjadi angka (1, 2, 3).')]},
{t:'Struktur sebuah UU',i:['Kerangka UU secara umum, dari atas ke bawah:',
FL('Judul','Pembukaan: frasa pembuka, jabatan pembentuk, konsiderans (alasan), dasar hukum, diktum','Batang tubuh: ketentuan umum, materi pokok, ketentuan peralihan, ketentuan penutup (disusun dalam bab, bagian, paragraf, pasal, ayat)','Penutup: pengesahan, pengundangan','Penjelasan (jika diperlukan)','Lampiran (jika diperlukan)'),
I('Mengapa perlu tahu strukturnya?','Konsiderans dan dasar hukum menunjukkan alasan dan aturan yang menjadi pijakan. Ini cara mengecek sinkronisasi vertikal.')]},
{t:'Pancasila sampai Perda',i:['Pancasila bukan salah satu jenis peraturan dalam Pasal 7. Ia dasar negara dan sumber segala sumber hukum, rumusannya ada di Alinea IV Pembukaan UUD.',
TB('Perbedaan instrumen',['Instrumen','Kedudukan sederhana','Fungsi utama'],[
['Pancasila','Dasar negara dan sumber segala sumber hukum','Nilai dasar'],
['UUD NRI 1945','Hukum dasar atau konstitusi','Dasar penyelenggaraan negara'],
['UU','Peraturan perundang-undangan','Mengatur hal tertentu lebih rinci'],
['PP','Di bawah UU','Menjalankan UU'],
['Perpres','Di bawah UU sesuai kewenangan','Pengaturan oleh Presiden'],
['Perda','Peraturan daerah','Mengatur urusan daerah']]),
FL('Pancasila: nilai dasar','UUD: aturan dasar negara','UU: pengaturan lebih konkret','PP dan Perpres: pelaksanaan lebih lanjut','Perda: pengaturan sesuai kebutuhan daerah'),
I('Apakah semua nilai Pancasila langsung menjadi pasal?','Tidak. Nilai dijabarkan bertahap. Contoh: sila kelima menjiwai Pasal 34 ayat (1) UUD (fakir miskin dan anak terlantar dipelihara negara), lalu dirinci UU terkait, kemudian aturan pelaksana dan perda.'),
I('Apakah Pancasila di atas UUD?','Pancasila adalah sumber nilai dan dasar negara; rumusannya dimuat dalam Pembukaan UUD, yang berkedudukan sebagai tertib hukum tertinggi. Roh dan raga tidak terpisah: Pancasila rohnya, UUD raganya.'),
I('Hubungan formal dan materiel','Formal: rumusan Pancasila tercantum di Pembukaan. Materiel: seluruh pokok kaidah Pembukaan bersumber pada Pancasila. Contoh: sila pertama dan Pasal 29 ayat (1) dan (2); tidak boleh ada produk hukum yang melarang kebebasan beragama.')]},
{t:'Siapa membuat apa',i:[TB('Peta kewenangan',['Pembentuk','Produk hukum'],[
['DPR bersama Presiden','Undang-Undang'],['Presiden','Perppu, PP, Perpres'],['MPR','Ketetapan MPR; perubahan UUD'],['DPRD bersama kepala daerah','Perda (Provinsi dan Kab/Kota)']]),
H('Pilih produk hukum yang tepat'),
I('Kasus 1: mengatur pelaksanaan suatu UU','PP.'),
I('Kasus 2: bidang baru butuh dasar UU','UU, dibentuk DPR bersama Presiden.'),
I('Kasus 3: masalah menjadi kewenangan daerah','Perda.'),
I('Kasus 4: keadaan genting dan memaksa, belum ada UU','Perppu, ditetapkan Presiden.'),
I('Pertanyaan berpikir','Jika aturan hanya mengatur pelaksanaan UU, apakah harus dibuat UU baru? Tidak; cukup PP atau aturan pelaksana yang sesuai.')]},
{t:'Proses lahirnya peraturan',i:['Peraturan tidak muncul begitu saja. Alur umumnya:',
FL('Masalah masyarakat','Kebutuhan pengaturan','Perencanaan dan penyusunan rancangan','Pembahasan','Pengesahan atau penetapan','Pengundangan (UU, PP, Perpres dimuat di Lembaran Negara; Perda di Lembaran Daerah)','Berlaku, dilaksanakan, dan dievaluasi'),
I('Di mana aspirasi masuk?','Pada tahap penyusunan dan pembahasan: kunjungan wakil rakyat, dialog lisan, titip aspirasi tertulis, rapat dengar pendapat. Produk hukum responsif membutuhkan partisipasi (asas keterbukaan).'),
I('Catatan RUU','RUU yang sudah disetujui bersama DPR dan Presiden disahkan Presiden. Jika tidak ditandatangani dalam 30 hari sejak disetujui, RUU tetap sah menjadi UU (Pasal 20 ayat (5) UUD NRI 1945).')]},
{t:'Konflik antarperaturan & asas',i:[H('Hierarki bukan tingkat kepentingan'),
'Apakah Perpres selalu lebih penting daripada Perda? Jangan menjawab dengan kata penting. Hierarki menunjukkan kedudukan hukum, bukan sekadar tingkat kepentingan.',
H('Satu rangkaian logis'),FL('Hierarki','Konflik antarperaturan','Asas yang dipakai','Pengujian (judicial review)'),
I('Contoh: UU membolehkan A, perda melarang A','1) Boleh? Tidak, perda bertentangan dengan UU. 2) Aturan lebih tinggi: UU. 3) Asas: lex superiori derogat legi inferiori. 4) Jalur: perda diuji ke Mahkamah Agung.'),
TB('Empat asas dalam hierarki',['Asas','Makna'],[
['Lex superiori derogat legi inferiori','Aturan lebih tinggi mengesampingkan yang lebih rendah'],
['Lex specialis derogat legi generali','Tingkat dan materi sama: aturan khusus mengesampingkan yang umum'],
['Lex posteriori derogat legi priori','Tingkat sama: aturan baru mengesampingkan yang lama; mencegah ketidakpastian hukum'],
['Asas keempat','Peraturan yang masih berlaku hanya dapat dihapus, dicabut, atau diubah oleh peraturan yang sederajat atau lebih tinggi']]),
TB('Pasal 7 vs Pasal 8',['Pasal','Isinya'],[
['Pasal 7','Jenis dan hierarki peraturan perundang-undangan'],
['Pasal 8','Peraturan lain yang diakui bila diperintahkan peraturan lebih tinggi atau dibentuk berdasarkan kewenangan']])]},
{t:'Contoh judicial review',i:['Kenapa ada dua lembaga? Karena yang diuji berbeda tingkat.',
TB('Siapa yang menguji?',['Yang dipersoalkan','Diuji terhadap','Lembaga'],[
['UU yang dianggap bertentangan dengan UUD','UUD NRI 1945','Mahkamah Konstitusi (MK)'],
['Peraturan Menteri atau Perda yang dianggap bertentangan dengan UU','UU','Mahkamah Agung (MA)']]),
I('Simulasi 1','Ada UU yang dianggap bertentangan dengan UUD. Siapa yang menguji? MK.'),
I('Simulasi 2','Ada Peraturan Menteri yang dianggap bertentangan dengan UU. Siapa yang menguji? MA.'),
I('Aturan yang kokoh','Peraturan yang searah dengan atasnya, dapat dilaksanakan dan memberi kepastian, serta melayani rakyat dan adil, tidak mudah digugat. Analisis dan evaluasi hukum juga dilakukan akademisi, peneliti, dan BPHN (bphn.go.id).')]},
{t:'Istilah yang tertukar',i:[TB('Pasangan istilah',['Pasangan','Perbedaan'],[
['Kesadaran vs kepatuhan hukum','Kesadaran = pengetahuan dan nilai (abstrak); kepatuhan = perilaku nyata'],
['Hukum memaksa vs mengatur','Memaksa tidak bisa dikesampingkan (pidana); mengatur dapat dikesampingkan perjanjian (warisan)'],
['Hukum materiel vs formal','Materiel = isi larangan dan kebolehan; formal = cara mempertahankannya (KUHAP)'],
['Ius constitutum vs constituendum','Yang berlaku sekarang vs yang dicita-citakan'],
['Otonom vs responsif','Otonom = tidak diintervensi; responsif = menjawab tantangan masa depan'],
['Harmonisasi vs sinkronisasi','Penyelarasan rancangan agar sesuai asas; penyelarasan antaraturan agar tidak tumpang tindih (vertikal dan horizontal)'],
['Perppu vs UU','Perppu ditetapkan Presiden saat kegentingan memaksa; UU disetujui bersama DPR dan Presiden; muatannya sama'],
['Judicial review MK vs MA','MK: UU terhadap UUD; MA: aturan di bawah UU terhadap UU'],
['Equity vs equality','Proporsional menurut kebutuhan vs sama rata'],
['Pasal 7 vs Pasal 8','Jenis dan hierarki vs peraturan lain yang diakui']])]},
{t:'Hafalan & catatan sumber',i:[
I('Hierarki','UUD, Tap MPR, UU/Perppu, PP, Perpres, Perda Provinsi, Perda Kab/Kota.'),
I('3 prinsip hukum','Keadilan, kemanfaatan, kepastian.'),
I('3 jenis ketaatan','Terpaksa, identifikasi, kesadaran diri (yang diharapkan).'),
I('4 sifat norma hukum','Mengikat, memaksa, otonom, responsif.'),
I('4 faktor pelanggaran hak','Egois, kurang kesadaran, merasa eksklusif, penyalahgunaan teknologi.'),
I('7 dasar penggolongan hukum','Isi, bentuk, sumber, sifat, cara mempertahankan, waktu, tempat.'),
I('5 cara keadilan Pancasila','Tujuan pembangunan, equity, paham kebangsaan, musyawarah mufakat, hak dan kewajiban selaras.'),
I('4 asas hierarki','Lex superiori, lex specialis, lex posteriori, dan aturan hanya diubah oleh yang sederajat atau lebih tinggi.'),
I('Dasar utama','Pasal 1 ayat (3) dan Pasal 27 ayat (1) UUD NRI 1945; UU 12/2011 jo. UU 15/2019 jo. UU 13/2022; Tap MPR III/MPR/2000.'),
H('Catatan perbedaan antarsumber'),
'Untuk ujian, ikuti buku bila slide berbeda.',
I('Penulisan asas','Slide: Lex Superior dan Lex Posterior. Buku: Lex Superiori dan Lex Posteriori. Bentuk buku lebih umum dipakai dalam soal sekolah.'),
I('Tap MPR 2003','Slide: No. I/MPR/2003; buku: No. 1/MPR/2003. Keduanya sama.'),
I('UU dan Perppu','Slide menyebut keduanya disetujui DPR bersama Presiden. Buku membedakan: UU disetujui bersama; Perppu ditetapkan Presiden sendiri dalam kegentingan memaksa.'),
I('UU No. 13 Tahun 2002','Di slide tampaknya salah ketik; buku merujuk UU 13/2022.'),
I('Penggolongan waktu dan wilayah','Slide memuat istilah tambahan (hukum alam, hukum masa lalu, hukum antarwaktu). Ikuti 7 dasar buku yang sama dengan lembar Penggolongan Hukum.')]});

/* ---------- Simulasi tambahan ---------- */
SIMS.push(
{id:'s5',title:'Perda Melarang yang Dibolehkan UU',intro:'Sebuah UU membolehkan kegiatan usaha kecil di tepi jalan dengan izin. Perda kotamu justru melarangnya secara total. Para pedagang bingung dan resah.',steps:[
{q:'Aturan mana yang lebih tinggi kedudukannya?',o:[{t:'UU, karena berada di atas Perda dalam hierarki',r:'Tepat. Hierarki menunjukkan kedudukan hukum, bukan sekadar kepentingan.',s:2},{t:'Perda, karena lebih dekat dengan warga',r:'Kedekatan tidak mengubah kedudukan. Perda tetap di bawah UU.',s:0},{t:'Yang lebih baru',r:'Asas lex posteriori hanya untuk aturan yang sederajat.',s:0}]},
{q:'Asas apa yang berlaku?',o:[{t:'Lex superiori derogat legi inferiori',r:'Tepat. Aturan lebih rendah tidak boleh bertentangan dengan yang lebih tinggi.',s:2},{t:'Lex posteriori derogat legi priori',r:'Itu untuk dua aturan yang sederajat.',s:0},{t:'Lex specialis derogat legi generali',r:'Itu untuk aturan sederajat dengan materi sama. Di sini tingkatnya berbeda.',s:1}]},
{q:'Langkah warga yang paling tepat?',o:[{t:'Menyampaikan aspirasi secara santun dan mengajukan pengujian Perda ke Mahkamah Agung',r:'Tepat. Peraturan di bawah UU diuji ke MA, dan aspirasi disampaikan lewat jalur resmi tanpa anarki.',s:2},{t:'Mengajukan pengujian ke Mahkamah Konstitusi',r:'MK menguji UU terhadap UUD. Perda terhadap UU diuji di MA.',s:0},{t:'Memblokir jalan sebagai protes',r:'Aspirasi harus santun, tidak emosional, tidak anarkis.',s:0}]}]},
{id:'s6',title:'Pilih Produk Hukum yang Tepat',intro:'Kamu bertugas di tim perancang aturan. Ada tiga situasi berbeda, dan kamu harus memilih produk hukum yang sesuai kewenangannya.',steps:[
{q:'Pemerintah ingin mengatur cara pelaksanaan suatu UU. Produk hukumnya?',o:[{t:'Peraturan Pemerintah',r:'Tepat. PP ditetapkan Presiden untuk menjalankan UU sebagaimana mestinya.',s:2},{t:'UU baru',r:'Tidak perlu. UU sudah ada, yang dibutuhkan aturan pelaksananya.',s:0},{t:'Ketetapan MPR',r:'Tap MPR bukan untuk menjalankan UU.',s:0}]},
{q:'Terjadi keadaan genting dan memaksa, belum ada UU sebagai payung hukum. Produk hukumnya?',o:[{t:'Perppu',r:'Tepat. Ditetapkan Presiden dalam hal ihwal kepentingan yang memaksa, bermateri sama dengan UU.',s:2},{t:'Perda',r:'Perda untuk urusan daerah, bukan kegentingan nasional.',s:0},{t:'Peraturan menteri',r:'Peraturan menteri tidak bisa menggantikan UU.',s:0}]},
{q:'Pemerintah kabupaten ingin mengatur ketertiban umum di wilayahnya. Produk hukumnya?',o:[{t:'Perda Kabupaten, bersama DPRD dan bupati, dengan merujuk UU, PP, dan perda provinsi yang sejalur',r:'Tepat. Perda dibuat sesuai kewenangan daerah dan sinkron vertikal.',s:2},{t:'Perpres',r:'Perpres ditetapkan Presiden, bukan kabupaten.',s:0},{t:'Peraturan sendiri tanpa rujukan',r:'Tanpa rujukan ke aturan di atasnya, risiko disharmonisasi meningkat.',s:1}]}]},
{id:'s7',title:'Norma Mana yang Dilanggar?',intro:'Tiga kejadian berikut terjadi di lingkungan sekitarmu. Tidak semua perilaku buruk otomatis menjadi pelanggaran hukum.',steps:[
{q:'Seorang tetangga tidak pernah menyapa siapa pun. Pelanggaran apa?',o:[{t:'Belum tentu pelanggaran hukum; paling dekat norma kesopanan',r:'Tepat. Tidak ada aturan hukum yang melarang dan memberi sanksi.',s:2},{t:'Tindak pidana',r:'Terlalu jauh. Tindak pidana harus memenuhi unsur yang ditentukan hukum.',s:0},{t:'Tidak ada norma apa pun',r:'Ada norma kesopanan yang terkait.',s:1}]},
{q:'Seseorang mencuri sepeda motor. Bagaimana kaitannya dengan norma?',o:[{t:'Melanggar norma agama, kesusilaan, dan kesopanan, serta dapat menjadi pelanggaran hukum pidana',r:'Tepat. Satu perbuatan dapat melanggar beberapa norma sekaligus.',s:2},{t:'Hanya melanggar kesopanan',r:'Terlalu sempit. Ada unsur hukum pidana.',s:0},{t:'Hanya urusan pribadi dua pihak',r:'Pencurian menyangkut kepentingan umum sehingga negara dapat menuntut.',s:0}]},
{q:'Seseorang membuang sampah sembarangan. Kapan menjadi persoalan hukum?',o:[{t:'Jika ada aturan, misalnya perda, yang melarang dan memberi sanksi',r:'Tepat. Hukum butuh aturan yang jelas dan sanksi.',s:2},{t:'Selalu, tanpa melihat aturan',r:'Tanpa aturan yang melarang, ia belum tentu pelanggaran hukum.',s:0},{t:'Tidak pernah',r:'Bisa menjadi persoalan hukum bila ada aturan dan sanksi.',s:0}]}]});

/* ---------- Belajar bertahap tambahan ---------- */
TOPICS.m2.push({id:'t_norma',title:'Norma, hukum, dan pelanggaran',stages:[
R('Pahami',['Hukum adalah bagian dari norma. Semua hukum adalah norma, tetapi tidak semua norma adalah hukum.',{t:'Empat norma',d:'Agama, kesusilaan, kesopanan, hukum. Beda pada sumber dan sanksinya.'},{t:'Pelanggaran hukum',d:'Perilaku yang melanggar aturan hukum yang memberi larangan dan sanksi.'}]),
R('Bedah konsep',['Bagian ini pengembangan penyusun dari isi buku.',{t:'Ukuran pelanggaran hukum',d:'Ada aturan yang melarang dan menetapkan sanksinya. Tanpa itu, perbuatan buruk tetap melanggar norma lain, tetapi belum tentu hukum.'}]),
QZ('Analisis',[{q:'Tidak menyapa tetangga paling tepat disebut pelanggaran...',o:['Norma kesopanan','Tindak pidana','Norma hukum yang pasti'],a:0,e:'Belum ada aturan hukum yang melarang dan memberi sanksi.'},{q:'Satu perbuatan mencuri dapat melanggar...',o:['Hanya norma hukum','Beberapa norma sekaligus','Tidak ada norma'],a:1,e:'Agama, kesusilaan, kesopanan, dan hukum.'}]),
SM('Simulasi','s7'),
QZ('Evaluasi',[{q:'Semua hukum adalah norma, tetapi...',o:['Semua norma adalah hukum','Tidak semua norma adalah hukum','Norma bukan hukum'],a:1,e:'Hukum adalah bagian dari norma.'},{q:'Membuang sampah sembarangan menjadi persoalan hukum jika...',o:['Orang lain tidak suka','Ada aturan yang melarang dan memberi sanksi','Ada yang melihat'],a:1,e:'Hukum butuh larangan dan sanksi yang jelas.'}]),
RF('Refleksi','Berikan satu contoh perilaku yang melanggar norma tetapi belum tentu melanggar hukum, dan satu yang melanggar keduanya.')]});
TOPICS.m4=[
{id:'t_baca',title:'Membaca identitas dan pasal peraturan',stages:[
R('Pahami',['Setiap peraturan punya identitas: jenis, nomor, tahun, dan materi.',{t:'Contoh',d:'Undang-Undang Republik Indonesia Nomor 12 Tahun 2011 tentang Pembentukan Peraturan Perundang-undangan: jenis UU, nomor 12, tahun 2011, materi pembentukan peraturan.'},{t:'Rujukan pasal',d:'Pasal 28J ayat (1) berarti Pasal 28J, ayat (1). Ayat dirinci menjadi huruf, huruf menjadi angka.'}]),
R('Bedah konsep',['Bagian ini pengembangan penyusun.',{t:'Nomor bukan tingkat kepentingan',d:'Kedudukan ditentukan oleh jenis peraturan, bukan oleh angka nomor.'},{t:'Gunanya',d:'Kamu dapat menelusuri aturan sumbernya dan memeriksa sinkronisasi.'}]),
QZ('Analisis',[{q:'Pada Peraturan Pemerintah Nomor 35 Tahun 2021, angka 2021 menunjukkan...',o:['Tahun ditetapkan','Nomor urut','Tingkat kepentingan'],a:0,e:'Tahun menunjukkan kapan peraturan ditetapkan.'},{q:'Pasal 7 ayat (1) huruf c UU 12/2011 dibaca...',o:['Pasal 7, ayat (1), huruf c','Pasal 1, ayat 7, huruf c','Huruf 7, ayat c'],a:0,e:'Urutannya pasal, ayat, huruf.'}]),
QZ('Evaluasi',[{q:'Bagian \'tentang ...\' pada identitas peraturan menunjukkan...',o:['Materi yang diatur','Pembentuknya','Tahun berlaku'],a:0,e:'Materi atau hal yang diatur.'},{q:'Yang menentukan kedudukan peraturan dalam hierarki adalah...',o:['Jenisnya','Nomornya','Panjang isinya'],a:0,e:'Kedudukan ditentukan jenis peraturan.'}]),
RF('Refleksi','Pilih satu peraturan yang kamu kenal. Tuliskan jenis, nomor, tahun, dan materinya.')]},
{id:'t_konflik',title:'Konflik antarperaturan',stages:[
R('Pahami',['Jika dua aturan bertentangan, gunakan asas untuk menentukan yang berlaku.',{t:'Lex superiori',d:'Aturan lebih tinggi mengesampingkan yang lebih rendah.'},{t:'Lex specialis',d:'Tingkat dan materi sama: khusus mengalahkan umum.'},{t:'Lex posteriori',d:'Tingkat sama: yang baru mengalahkan yang lama.'}]),
R('Bedah konsep',['Bagian ini pengembangan penyusun.',{t:'Memilih asas',d:'Pertama lihat tingkatnya. Beda tingkat: lex superiori. Sama tingkat dan materi: lihat khusus atau umum, lalu baru atau lama.'},{t:'Jalur penyelesaian',d:'Aturan yang bermasalah dapat diuji: UU di MK, aturan di bawah UU di MA.'}]),
QZ('Analisis',[{q:'UU membolehkan A, Perda melarang A. Asas yang berlaku...',o:['Lex superiori derogat legi inferiori','Lex posteriori derogat legi priori','Lex specialis derogat legi generali'],a:0,e:'Beda tingkat: yang tinggi menang.'},{q:'Dua peraturan menteri sederajat dan bertentangan, tahun 2018 dan 2024. Yang berlaku...',o:['Yang 2024','Yang 2018','Keduanya'],a:0,e:'Lex posteriori: yang baru menang pada tingkat sama.'}]),
SM('Simulasi','s5'),
QZ('Evaluasi',[{q:'Perda dinilai bertentangan dengan UU. Diuji di...',o:['Mahkamah Agung','Mahkamah Konstitusi','DPR'],a:0,e:'Aturan di bawah UU diuji di MA.'},{q:'Hierarki menunjukkan...',o:['Kedudukan hukum','Tingkat kepentingan semata','Banyaknya pasal'],a:0,e:'Kedudukan hukum, bukan sekadar kepentingan.'}]),
RF('Refleksi','Mengapa aturan yang lebih rendah tidak boleh bertentangan dengan yang lebih tinggi? Kaitkan dengan kepastian hukum.')]}];

/* ---------- Mini quiz tambahan (ditambah ke quiz modul) ---------- */
QUIZ.m1.push({q:'Hukum, norma, dan peraturan perundang-undangan: pernyataan yang tepat adalah...',o:['Semua norma adalah hukum','Peraturan perundang-undangan adalah salah satu bentuk hukum tertulis','Hukum hanya berbentuk UU','Norma tidak berkaitan dengan hukum'],a:1,e:'Hukum lebih luas; peraturan perundang-undangan hanya salah satu bentuk hukum tertulis.'},
{q:'Sumber hukum formil meliputi...',o:['Undang-undang, kebiasaan, traktat, yurisprudensi, doktrin','Pancasila dan kondisi sosial','Hanya undang-undang','Hanya hukum adat'],a:0,e:'Sumber formil: UU, kebiasaan, traktat, yurisprudensi, doktrin.'});
QUIZ.m2.push({q:'Seseorang digugat karena wanprestasi. Cabang hukum yang relevan...',o:['Hukum pidana','Hukum perdata','Hukum tata negara','Hukum internasional'],a:1,e:'Hubungan antarindividu berdasarkan perjanjian masuk hukum perdata.'},
{q:'Tidak menyapa tetangga paling tepat disebut pelanggaran...',o:['Norma kesopanan','Tindak pidana','Hukum internasional','Pelanggaran konstitusi'],a:0,e:'Belum ada aturan hukum yang melarang dan memberi sanksi.'});
QUIZ.m3.push({q:'Anak pejabat merasa kebal aturan karena jabatan orang tuanya. Faktor penyebabnya...',o:['Merasa eksklusif','Toleransi','Musyawarah','Sinkronisasi'],a:0,e:'Jabatan, pangkat, kekayaan, atau kerabat memicu merasa eksklusif.'});
QUIZ.m4.push({q:'Dalam Peraturan Presiden Nomor 82 Tahun 2018, angka 82 menunjukkan...',o:['Nomor urut peraturan pada tahun tersebut','Tingkat kepentingan','Jumlah pasal','Tahun ditetapkan'],a:0,e:'Nomor adalah nomor urut, bukan tingkat kepentingan.'},
{q:'Siapa pembentuk Undang-Undang?',o:['DPR bersama Presiden','Presiden saja','MPR','DPRD dan gubernur'],a:0,e:'UU disetujui bersama DPR dan Presiden, lalu disahkan Presiden.'},
{q:'Pancasila termasuk salah satu jenis peraturan dalam hierarki Pasal 7 ayat (1).',o:TF,a:1,e:'Pancasila adalah dasar negara dan sumber segala sumber hukum, bukan jenis peraturan dalam Pasal 7.'});
})();

/* Soal latihan Bab 2 berpola 5 opsi (A-E), disusun dari contoh guru + soal tambahan. Kunci dan pembahasan oleh penyusun web. */
(()=>{const P=(lv,c,q,o,a,e)=>LQ.BANK.push({lv,c,q,o,a,e,set:'B2'});
P('LOTS','C1','Hukum adalah seperangkat aturan yang bertujuan untuk mengatur kehidupan masyarakat agar tercipta ...',['kebebasan tanpa batas','ketertiban dan keadilan','persaingan antarindividu','kesamaan seluruh kepentingan','kekuasaan pemerintah'],1,'Tujuan hukum: ketertiban, ketenteraman, dan keadilan.');
P('LOTS','C1','Menurut Pasal 1 ayat (3) UUD NRI 1945, Indonesia adalah negara hukum. Apa yang dimaksud dengan negara hukum?',['Negara yang seluruh tatanan kehidupannya diatur oleh hukum','Negara yang mengutamakan hukum pidana','Negara yang hukum utamanya berasal dari UUD','Negara yang tidak mengenal hierarki perundang-undangan','Negara yang seluruhnya beroperasi atas dasar hukum adat'],0,'Segala tatanan hidup bermasyarakat, berbangsa, dan bernegara didasarkan pada hukum yang berlaku.');
P('LOTS','C2','Tujuan hukum mencakup keadilan, manfaat, dan ketertiban. Mana yang merupakan salah satu fungsi hukum?',['Mengatur perilaku manusia di luar ketentuan formal','Memberikan pengesahan terhadap norma sosial yang berlaku','Menentukan kebijakan ekonomi dan sosial negara','Memaksakan hukum internasional di wilayah nasional','Melindungi individu dari segala perbedaan pendapat'],1,'Fungsi hukum (Rumokoy): legitimasi terhadap yang berlaku di masyarakat, alat rekayasa sosial, sarana pembangunan, dan mengatasi konflik.');
P('LOTS','C2','Keadilan sebagai unsur penegakan hukum dapat diwujudkan dengan ...',['menegakkan hukum hanya bagi kalangan tertentu','memberi sanksi tegas pada setiap pelanggaran hukum','memperhitungkan dampak ekonomi dalam pemberian hukuman','membuat peraturan yang berubah-ubah sesuai kebutuhan','mengutamakan kepentingan pemerintah di atas masyarakat'],1,'Prinsip keadilan: hukum berlaku bagi semua tanpa diskriminasi dan pelanggar disanksi sesuai UU.');
P('LOTS','C1','Perhatikan contoh: (1) UUD NRI 1945, (2) Peraturan Pemerintah, (3) kebiasaan masyarakat turun-temurun, (4) Peraturan Daerah. Contoh hukum tertulis ditunjukkan nomor ...',['1, 2, dan 3','1, 2, dan 4','1, 3, dan 4','2, 3, dan 4','1, 2, 3, dan 4'],1,'Kebiasaan masyarakat adalah hukum tidak tertulis.');
P('MOTS','C3','Dika dan Budi membuat perjanjian jual beli sepeda. Budi sudah membayar, tetapi Dika tidak menyerahkan sepedanya. Permasalahan ini termasuk ranah ...',['hukum pidana','hukum tata negara','hukum perdata','hukum internasional','hukum administrasi negara'],2,'Hubungan antarindividu yang bersifat pribadi (perjanjian) masuk hukum perdata (privat).');
P('LOTS','C2','Aturan berlaku bagi seluruh wilayah Indonesia dan dibuat lembaga negara yang berwenang. Berdasarkan tempat berlakunya, aturan itu termasuk ...',['hukum asing','hukum internasional','hukum nasional','hukum adat','hukum privat'],2,'Hukum nasional berlaku di wilayah suatu negara tertentu.');
P('LOTS','C1','Yang dimaksud hukum publik adalah ...',['hukum yang mengatur kepentingan negara terhadap individu','hukum yang mengatur warga negara dengan lembaga keuangan','hukum yang berlaku secara internasional','hukum yang disusun lembaga swadaya masyarakat','hukum tidak tertulis yang berlaku di masyarakat adat'],0,'Hukum publik mengatur hubungan negara dengan warga untuk kepentingan umum.');
P('LOTS','C2','Pemerintah menetapkan peraturan tentang hubungan pemerintah dengan warga dalam administrasi pemerintahan. Berdasarkan isinya, hukum tersebut termasuk ...',['hukum privat','hukum publik','hukum perdata','hukum dagang','hukum adat'],1,'Hukum administrasi negara termasuk hukum publik.');
P('LOTS','C1','Contoh hukum berdasarkan sumbernya adalah ...',['undang-undang','kebiasaan','traktat','yurisprudensi','semua jawaban benar'],4,'Sumber hukum: UU, kebiasaan, traktat, yurisprudensi, doktrin.');
P('LOTS','C2','Hukum bagi perkara tindak pidana, sanksinya wajib dilaksanakan. Dalam hal ini hukum bersifat ...',['memaksa','mengatur','fleksibel','kaku','rigid'],0,'Hukum memaksa harus ditegakkan dalam keadaan apa pun.');
P('LOTS','C2','Hukum dapat dikesampingkan bila pihak-pihak sudah membuat peraturan tersendiri dalam perjanjian. Hukum ini bersifat ...',['memaksa','mengatur','fleksibel','kaku','rigid'],1,'Hukum yang mengatur dapat dikesampingkan oleh perjanjian, misalnya pembagian warisan.');
P('HOTS','C5','Sebagian orang menganggap pelanggaran kecil seperti pelanggaran lalu lintas tidak berdampak besar. Kaitan dengan prinsip negara hukum yang mengutamakan kepatuhan tanpa kecuali adalah ...',['negara hukum hanya berlaku untuk pelanggaran serius','pelanggaran kecil dapat dimaafkan jika tidak berbahaya','negara hukum mengharuskan setiap pelanggaran, besar atau kecil, ditindak','masyarakat boleh menilai sendiri tingkat pelanggarannya','hukum hanya berlaku bagi yang tidak berkuasa'],2,'Pasal 27 ayat (1): setiap warga wajib menjunjung hukum tanpa ada kecualinya.');
P('HOTS','C5','Ada ketidaksesuaian antara hukum yang berlaku dan nilai-nilai yang diyakini masyarakat. Cara terbaik menghadapinya adalah ...',['mengabaikan hukum yang tidak sesuai','mengubah nilai masyarakat agar sesuai hukum','menyampaikan aspirasi kepada pembuat kebijakan untuk merevisi hukum','melakukan protes massal','meminta sanksi yang lebih ringan'],2,'Aspirasi disampaikan secara santun lewat jalur yang tersedia, tidak anarkis; produk hukum seharusnya responsif.');
P('LOTS','C1','Berdasarkan asal-usulnya, norma kesopanan bersumber dari ...',['hati nurani manusia','kitab suci dan kepercayaan kepada Tuhan YME','adat dan tata pergaulan antarwarga','hukum yang berlaku di suatu negara','Ketetapan MPR'],2,'Tabel 2.1: kesusilaan dari hati nurani, kesopanan dari adat dan tata pergaulan.');
P('MOTS','C3','Menjelang hari raya salah satu agama, teman-teman yang berbeda agama turut mengucapkan selamat dan menjaga ketenangan lingkungan. Sikap ini penerapan norma agama dalam bentuk ...',['ketaatan karena terpaksa','penyeragaman keyakinan','pembatasan ibadah','penegakan sanksi hukum','toleransi beragama'],4,'Sebagai umat beragama kita mengembangkan sikap saling menghormati (toleransi).');
P('MOTS','C3','Warga RW menyepakati tamu yang bermalam lebih dari 1x24 jam wajib lapor ketua RT. Aturan itu termasuk ...',['norma hukum tertulis di masyarakat','norma kesusilaan','norma kesopanan','norma agama','hukum internasional'],0,'Buku hlm. 76 menyebut ketentuan tamu 1x24 jam sebagai contoh norma hukum tertulis di masyarakat.');
P('LOTS','C2','Makna sifat memaksa pada norma hukum adalah ...',['berisi perintah dan larangan yang harus ditaati','tidak boleh dicampuri kepentingan lain kecuali penegakan hukum dan keadilan','pelanggarnya dikenai sanksi dan ditegakkan alat kelengkapan negara','mampu memprediksi kondisi masyarakat di masa depan','dibuat berdasarkan kesepakatan seluruh warga'],2,'Mengikat = perintah dan larangan; otonom = tidak diintervensi; responsif = berorientasi masa depan.');
P('MOTS','C3','Seorang siswa membantu tetangga yang rumahnya banjir tanpa ada aturan tertulis yang mewajibkan. Tindakan itu penerapan norma yang bersumber dari ...',['kitab suci agama','hati nurani manusia','peraturan perundang-undangan','putusan pengadilan','peraturan kepala daerah'],1,'Norma kesusilaan bersumber dari hati nurani.');
P('LOTS','C1','Peraturan tertulis yang memuat norma hukum mengikat secara umum, dibentuk lembaga atau pejabat berwenang melalui prosedur yang ditetapkan, adalah pengertian ...',['peraturan perundang-undangan','norma kesusilaan','hukum adat','konvensi ketatanegaraan','yurisprudensi'],0,'Pasal 1 ayat (2) UU 12/2011.');
P('LOTS','C1','Urutan hierarki peraturan dari tertinggi ke terendah menurut Pasal 7 ayat (1) UU 12/2011 jo. UU 13/2022 adalah ...',['UUD, UU/Perppu, TAP MPR, PP, Perpres, Perda Prov, Perda Kab/Kota','UUD, TAP MPR, PP, UU/Perppu, Perpres, Perda Prov, Perda Kab/Kota','TAP MPR, UUD, UU/Perppu, PP, Perpres, Perda Prov, Perda Kab/Kota','UUD, TAP MPR, UU/Perppu, PP, Perpres, Perda Kab/Kota, Perda Prov','UUD, TAP MPR, UU/Perppu, PP, Perpres, Perda Prov, Perda Kab/Kota'],4,'Perhatikan posisi UU/Perppu di atas PP dan Perda Provinsi di atas Perda Kab/Kota.');
P('HOTS','C5','Pemda menyusun raperda pengelolaan sampah. Rancangan yang paling sesuai dengan prinsip harmonisasi dan sinkronisasi adalah yang ...',['hanya merujuk perda kabupaten lain agar cepat','mengesampingkan UU karena kondisi daerah khusus','disusun tertutup oleh kepala daerah tanpa masukan masyarakat','merujuk UUD, UU, PP, dan perda provinsi tentang sampah, merinci pelaksanaan sesuai kondisi daerah, serta menampung masukan warga','memuat aturan lebih umum daripada UU agar fleksibel'],3,'Sinkron vertikal (dengan aturan di atasnya) dan partisipatif; makin rendah aturan makin detail dan operasional.');
P('MOTS','C3','Warga menilai satu UU bertentangan dengan UUD NRI 1945 dan satu PP bertentangan dengan UU. Lembaga yang berwenang menguji keduanya secara berturut-turut adalah ...',['MA dan MK','MK dan MK','MA dan MA','DPR dan Presiden','MK dan MA'],4,'UU terhadap UUD diuji di MK; peraturan di bawah UU diuji di MA.');
P('HOTS','C5','Proses A: RUU dibahas tertutup tanpa masukan masyarakat agar cepat. Proses B: RUU serupa dibahas lewat rapat dengar pendapat dengan pekerja, akademisi, dan organisasi masyarakat. Penilaian paling tepat adalah ...',['A lebih baik karena cepat dan menjamin hukum otonom','keduanya sama baik karena DPR berwenang penuh','B lebih mendukung produk hukum responsif karena menyerap harapan dan kebutuhan masyarakat','A lebih baik karena kerahasiaan menjamin kepastian','B melanggar sifat otonom hukum sehingga harus dihentikan'],2,'Produk hukum responsif membutuhkan partisipasi masyarakat (asas keterbukaan).');
P('HOTS','C5','Sebuah perda melarang warga beribadah menurut agamanya di wilayah tertentu, bertentangan dengan Pasal 29 ayat (1) dan (2) UUD. Penilaian paling tepat ...',['sah karena otonomi daerah','sah karena lebih baru (lex posteriori)','tidak dapat diuji karena perda bukan undang-undang','tidak sah karena bertentangan dengan aturan lebih tinggi (lex superiori) dan dapat diuji ke Mahkamah Agung','sah selama disetujui DPRD dan kepala daerah'],3,'Aturan lebih rendah tidak boleh bertentangan dengan yang lebih tinggi; Perda diuji ke MA.');
P('MOTS','C3','Terjadi keadaan genting dan memaksa, belum ada UU sebagai payung hukum. Presiden menetapkan peraturan bermateri sama dengan UU. Peraturan itu adalah ...',['Peraturan Pemerintah','Perppu','Peraturan Presiden','Ketetapan MPR','Perda Provinsi'],1,'Perppu: ditetapkan Presiden dalam hal ihwal kepentingan yang memaksa.');
P('MOTS','C3','Dua peraturan menteri sederajat, bertentangan, mengatur hal sama: satu tahun 2018, satu tahun 2024. Yang berlaku yang 2024 sesuai asas ...',['lex superiori derogat legi inferiori','lex specialis derogat legi generali','lex generalis derogat legi specialis','lex posteriori derogat legi priori','lex inferiori derogat legi superiori'],3,'Sederajat: yang baru mengesampingkan yang lama.');
P('LOTS','C1','Peraturan yang ditetapkan Presiden berisi ketentuan untuk menjalankan UU sebagaimana mestinya adalah ...',['Undang-Undang Dasar','Ketetapan MPR','Perda Provinsi','Peraturan Desa','Peraturan Pemerintah'],4,'PP: ditetapkan Presiden untuk menjalankan UU.');
P('HOTS','C4','Kementerian menerbitkan peraturan menteri untuk melaksanakan UU. Peraturan menteri tidak termasuk tujuh jenis hierarki Pasal 7 ayat (1). Kedudukannya ...',['tidak diakui karena di luar hierarki','lebih tinggi daripada PP','diakui dan mengikat sepanjang diperintahkan peraturan yang lebih tinggi atau dibentuk berdasarkan kewenangan','dapat menggantikan UU yang dilaksanakannya','hanya berlaku bagi pegawai kementerian itu'],2,'Pasal 8: peraturan menteri diakui selama diperintahkan atau berdasarkan kewenangan.');
/* soal tambahan berpola sama */
P('MOTS','C3','Rani selalu menuntut haknya sebagai anggota tim, tetapi mengabaikan tugas piket. Penyebab utama pelanggaran hak dan kewajiban dalam kasus ini adalah ...',['sikap egois','merasa eksklusif','penyalahgunaan teknologi','toleransi berlebihan','musyawarah mufakat'],0,'Egois: terlalu menuntut hak sambil mengabaikan kewajiban.');
P('LOTS','C2','Pancasila disebut sumber dari segala sumber hukum. Artinya Pancasila berkedudukan sebagai ...',['pasal dalam UUD','ideologi negara yang menjiwai dan asas pedoman dalam membuat peraturan','peraturan tertinggi dalam hierarki Pasal 7','hukum tidak tertulis yang bisa diubah','Ketetapan MPR'],1,'Fungsi: (1) ideologi negara, (2) asas dan pedoman pembentukan peraturan.');
P('MOTS','C3','Dodi tidak menyontek karena takut dilaporkan guru. Jenis ketaatan hukumnya ...',['karena terpaksa','identifikasi','kesadaran diri','karena kebiasaan masyarakat','karena keadilan sosial'],0,'Motivasinya takut sanksi sehingga butuh pengawasan.');
P('LOTS','C2','Fiksi hukum berpandangan bahwa ...',['hukum hanya berlaku bila diketahui','semua orang dianggap sudah tahu hukum','hukum yang tidak tertulis tidak berlaku','pemerintah tidak perlu mensosialisasikan hukum','hukum bersifat khayalan'],1,'Ketidaktahuan hukum tidak bisa dimaafkan; pemerintah tetap wajib sosialisasi.');
P('HOTS','C4','Seorang siswa mengatakan: Pancasila tidak perlu dikaitkan dengan peraturan daerah karena perda hanya urusan lokal. Analisis yang tepat ...',['benar karena perda berlaku lokal','benar karena Pancasila hanya dasar negara','keliru karena semua peraturan, termasuk perda, harus bersumber dan tidak bertentangan dengan Pancasila dan UUD','keliru karena perda lebih tinggi dari UU','benar selama disetujui DPRD'],2,'Semua peraturan harus merujuk Pancasila dan UUD; perda juga merujuk UU, PP, dan perda provinsi yang sejalur.');
/* soal pendalaman: cabang hukum, membaca peraturan, konflik antarperaturan */
P('MOTS','C3','Seseorang mencuri sepeda motor tetangganya. Perbuatan itu terutama diatur dalam cabang hukum ...',['hukum pidana','hukum perdata','hukum dagang','hukum tata negara','hukum internasional'],0,'Pencurian adalah perbuatan yang dilarang dan diancam sanksi: hukum pidana.');
P('MOTS','C3','Seorang warga menggugat keputusan pejabat tentang izin usaha yang dianggap merugikannya. Persoalan ini termasuk hukum ...',['pidana','administrasi negara','dagang','internasional','waris'],1,'Keputusan pejabat dalam administrasi pemerintahan masuk hukum administrasi negara.');
P('LOTS','C2','Pada Undang-Undang Nomor 12 Tahun 2011, angka 12 menunjukkan ...',['nomor urut peraturan pada tahun tersebut','tingkat kepentingan peraturan','jumlah pasal','tahun ditetapkan','jumlah ayat'],0,'Nomor adalah nomor urut, bukan tingkat kepentingan; tahun ditunjukkan angka 2011.');
P('LOTS','C2','Pasal 7 ayat (1) huruf c UU 12/2011 dibaca ...',['Pasal 7, ayat (1), huruf c','Pasal 1, ayat 7, huruf c','Ayat 7, pasal (1), huruf c','Huruf 7, pasal c, ayat (1)','Pasal c, ayat 7, huruf (1)'],0,'Urutan rujukan: pasal, ayat, huruf.');
P('MOTS','C3','Setelah RUU disetujui bersama DPR dan Presiden lalu disahkan, langkah berikutnya agar berlaku mengikat umum adalah ...',['pengundangan','perencanaan','pembahasan','penyusunan naskah akademik','evaluasi saja'],0,'Alur: perencanaan, penyusunan, pembahasan, pengesahan, pengundangan.');
P('HOTS','C4','UU membolehkan suatu kegiatan dengan izin, tetapi Perda melarangnya total. Penilaian dan langkah yang tepat ...',['Perda berlaku karena lebih dekat dengan warga','Perda bertentangan dengan aturan lebih tinggi dan dapat diuji ke Mahkamah Agung','kedua aturan sama kuat','diuji ke Mahkamah Konstitusi karena menyangkut UU','Perda berlaku karena dibuat lebih baru'],1,'Lex superiori: aturan rendah tidak boleh bertentangan dengan yang tinggi; Perda diuji ke MA.');
P('LOTS','C2','Pancasila dibedakan dari UUD NRI 1945 karena Pancasila ...',['dasar negara dan sumber segala sumber hukum','jenis peraturan di bawah UUD','sama dengan Ketetapan MPR','pasal dalam UU','pengganti UUD'],0,'Pancasila adalah nilai dasar; rumusannya dimuat dalam Pembukaan UUD dan dijabarkan dalam pasal-pasal.');
P('LOTS','C2','Pernyataan yang tepat tentang hukum dan peraturan perundang-undangan adalah ...',['tidak semua hukum berbentuk undang-undang','semua hukum tertulis dalam UU','hukum adat termasuk peraturan perundang-undangan','yurisprudensi termasuk peraturan perundang-undangan','hukum hanya ada pada UU'],0,'Hukum lebih luas: ada adat, kebiasaan, yurisprudensi, traktat, doktrin.');
P('HOTS','C5','Siswa A berkata Perpres selalu lebih penting daripada Perda. Tanggapan paling tepat ...',['hierarki menunjukkan kedudukan hukum, bukan sekadar tingkat kepentingan','Perda lebih penting karena menyangkut warga','keduanya sederajat','nomor yang lebih besar lebih tinggi','tahun yang lebih baru lebih tinggi'],0,'Kedudukan ditentukan jenis peraturan dalam hierarki, bukan kepentingan atau nomor.');
P('MOTS','C3','Tidak menyapa tetangga paling tepat dinilai sebagai pelanggaran ...',['norma kesopanan, belum tentu pelanggaran hukum','tindak pidana','hukum perdata','hukum internasional','konstitusi'],0,'Belum ada aturan hukum yang melarang dan memberi sanksi.');
})();
Nav.go();
