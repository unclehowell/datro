# Videos

## This directory contains the DATRO videos

noise cancellation on mic: wget -qO - https://bit.ly/2mBJSJo | sudo bash && pulseaudio -k && pulseaudio --start
(reboot after running)

OBS is a good screen recorder. Whatever you use to screen record, save it in raw AVI format.
Get the sound profile from the raw file and then normalizing it:
`ffmpeg -i input.mkv -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -`
Then enter the results into this script and run it (it also makes the file small):
`ffmpeg -i input.mkv -af loudnorm=I=-16:TP=-1.5:LRA=6:measured_I=-23.01:measured_LRA=6.40:measured_TP=-5.22:measured_thresh=-33.96:offset=0.01:linear=true:print_format=summary -ar 48k output.mkv`

finally convert the output from mkv to webm (takes hours): `ffmpeg -i output.mkv output.webm`
The sound should be improved and the filesize should be small.

Hmmmm - Don't think it worked as well as the last method I tried:

1. converted to webm using this command `ffmpeg -i input.avi output.webm`
This reduced my 17 minute video from 12GB to 40MB.
The run these commands in this order to further improve size and sound quality:
`ffmpeg-normalize output.webm -o output2.webm`
`ffmpeg-normalize *.webm -c:a aac -b:a 192k`
This creates a directory called Normalize and the video can be found inside it.

Then we want to sample that video to get the sound profile (output2.mkv)
`ffmpeg -i output2.mkv -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -`
This outputs a load of numbers, which you need to chuck into the next line of code to get the normalization algo acurate:
`ffmpeg -i output2.mkv -af loudnorm=I=-16:TP=-1.5:LRA=6:measured_I=-23.01:measured_LRA=6.40:measured_TP=-5.22:measured_thresh=-33.96:offset=0.01:linear=true:print_format=summary -ar 48k output3.mkv`

So the possibly not working method I just ran was:
1. get sound profile and run ffmpeg loundnorm (avi to mkv)
2. mkv to webm

Whereas the method that seemed to work earlier:
1. avi > webm
2. ffmpeg-normalize webm to webm `ffmpeg-normalize output.webm -o output2.webm` & `ffmpeg-normalize *.webm -c:a aac -b:a 192k`
3. then get sound profile and run loudnorm

Wait for the method I just ran to complete, to know for sure.
Perhaps looking at the two methods, I just need to do a combo of both:
1. convert avi to webm
2. normalize sound with ffmpeg-normalize
3. then, only if it's not great, use loudnorm (bit I think ffmpeg does this already)
I even think running ffmpeg-normalize twice may be uneccessary

So the final result is simply:
1. `ffmpeg -i input.avi output.webm` && `ffmpeg-normalize *.webm -c:a aac -b:a 192k`
But this, I believe, leaves us with a mkv file, I'm sure. When what we need is webm

That said, I recall taking the sound profile and running loudnorm did help. So failing the above one liner, perhaps:
1. `ffmpeg -i input.avi output.webm` && `ffmpeg-normalize *.webm -c:a aac -b:a 192k`  (call whatever it produces output.mkv)
2. `ffmpeg -i output.mkv -af loudnorm=I=-16:TP=-1.5:LRA=6:measured_I=-23.01:measured_LRA=6.40:measured_TP=-5.22:measured_thresh=-33.96:offset=0.01:linear=true:print_format=summary -ar 48k output3.mkv`
