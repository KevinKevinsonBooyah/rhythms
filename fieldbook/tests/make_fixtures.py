from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
out=Path('tmp/pdfs')
rows=[['1','Opening','0','','Side 1: 3.0 steps inside 45 yd ln','2.0 steps behind Front side line'],['1A','After 3','Subset','40','Side 1: 3.0 steps inside 45 yd ln','2.0 steps behind Front side line'],['2','30+20','1-10','10','Side 2: 3.5 steps inside 45 yd ln','10.75 steps in front of Front Hash (HS)'],['2B','After 2','Subset','8','Side 2: On 35 yd ln','8.0 steps behind Front Hash (HS)'],['6A','After 2','Subset','25','Side 1: 0.25 steps outside 50 yd ln','12.75 steps in front of Front Hash (HS)'],['20A','After 5','Subset','5','Side 2: 3.5 steps inside 45 yd ln','8.0 steps behind Front Hash (HS)']]
xs=[28,76,178,258,320,560]
for count,name in [(108,'fixture-108.pdf'),(1,'fixture-one.pdf')]:
 c=canvas.Canvas(str(out/name),pagesize=(900,420))
 for i in range(count):
  c.setFont('Helvetica',9)
  for j,row in enumerate([['Set','Title','Measure','Counts','Side 1-Side 2','Front-Back']]+rows):
   for x,text in zip(xs,row):c.drawString(x,380-j*31,text)
  for j,text in enumerate(['Performer: Alto Sax','Symbol: A',f'Label: {i+1}','Golden Valley 2026 Mvt 1',f'Page {i+1} of {count}']):c.drawString(28,125-j*17,text)
  c.showPage()
 c.save()
img=Image.new('RGB',(1800,840),'white');d=ImageDraw.Draw(img);font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
for j,row in enumerate([['Set','Title','Measure','Counts','Side 1-Side 2','Front-Back']]+rows):
 for x,text in zip(xs,row):d.text((x*2,60+j*62),text,font=font,fill='black')
for j,text in enumerate(['Performer: Alto Sax','Symbol: A','Label: 109','Golden Valley 2026 Mvt 1','Page 1 of 1']):d.text((56,590+j*34),text,font=font,fill='black')
img.save(out/'scanned.png');c=canvas.Canvas(str(out/'fixture-scan.pdf'),pagesize=(900,420));c.drawImage(ImageReader(img),0,0,900,420);c.save()
import wave,math,struct
with wave.open(str(out/'fixture-audio.wav'),'w') as w:
 w.setnchannels(1);w.setsampwidth(2);w.setframerate(8000)
 w.writeframes(b''.join(struct.pack('<h',int(3000*math.sin(2*math.pi*440*i/8000)) if i%4000<200 else 0) for i in range(8000*70)))
