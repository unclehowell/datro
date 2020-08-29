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

1. ffmpeg -i 2020-08-26_09-33-53.avi -filter:a "volume=15.6dB" output.webm
2. ffmpeg -i output.webm -filter:a "volume=11dB" output-new.webm
3. ffmpeg -i output.webm -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

	"input_i" : "-8.23",
	"input_tp" : "6.90",
	"input_lra" : "8.00",
	"input_thresh" : "-19.54",
	"output_i" : "-15.90",
	"output_tp" : "-1.50",
	"output_lra" : "7.30",
	"output_thresh" : "-27.00",
	"normalization_type" : "dynamic",
	"target_offset" : "-0.10"

  ffmpeg -i output-new.webm -af loudnorm=I=-16:TP=-1.5:LRA=7:measured_I=-8.23:measured_LRA=8.00:measured_TP=6.9:measured_thresh=-27.00:offset=0.10:linear=true:print_format=summary -ar 48k output-final.webm

There's a blog that has some code to do the job: https://medium.com/@jud.dagnall/dynamic-range-compression-for-audio-with-ffmpeg-and-compand-621fe2b1a892
It may need tweaking for my mic & laptop, the article has intructions:
  ffmpeg -i output-final.webm -filter_complex "compand=attacks=0:points=-80/-900|-45/-15|-27/-9|0/-7|20/-7:gain=5" output-final2.webm

  1. ffmpeg -i 2020-08-26_09-33-53.avi -filter:a "volume=15.6dB" output.webm
