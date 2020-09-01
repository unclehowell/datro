# Videos

## This directory contains the DATRO videos
## Also included is the methodology/ guideline for producing videos consistent with the others

There's few parts to producing the videos:
- Doing the screen record/ presentation
- Cleaning the Audio with Audacity
  - EQ: graphic equalize the sound
  - normalize (sets the overal optimum db's - either boosts or reduces)
  - compressor (levels voice fluctuation e.g. peaks and drops)
  - noise removal
   - de-esser, normalize)
-
Then rendering the recording with ffmpeg and ffmpeg-normalize.

The consensus so far (after a week messing) seems to be to do the following:
record, use noise canceling. It'll be quiet, but sound ok.
Then use ffmpeg and ffmpeg-normalize to boost and normalize the sound afterwards.

### Getting Started - Screen Recording

OBS is a good screen recorder. Whatever you use to screen record, save it in raw AVI format.
noise cancellation on mic: `wget -qO - https://bit.ly/2mBJSJo | sudo bash`
(reboot after running/ or try `sudo alsa force-reload`). New Mic Options will appear:
`Built-in Audio Analog Stereo (echo canceled with built in audio stereo)`

* If you get duplicate mic options, remove the duplicates in here.
/etc/pulse/default.pa (at the bottom of the file)

* trying to fight the filter by boosting your mic in OBS or in alsamixer is pointless.
  the filter does it's own thing. And it's best to just let it do what it does best.

### Getting Started - Video Editing

Openshot does the job.
- Background music should be licensed for common/ general public use)
- Perhaps save in mp4 since you'll need to normalize and boost audio with ffmpeg,
before final compression to webm (for hosting in the monorepo)

### Getting Started - improve the recording

#### Manually Normalize sound
Get the sound profile from the source:
`ffmpeg -i input.webm -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -`

`	"input_i" : "-8.23",
	"input_tp" : "6.90",
	"input_lra" : "8.00",
	"input_thresh" : "-19.54",
	"output_i" : "-15.90",
	"output_tp" : "-1.50",
	"output_lra" : "7.30",
	"output_thresh" : "-27.00",
	"normalization_type" : "dynamic",
	"target_offset" : "-0.10" `

Put results into this script and run it:
  `ffmpeg -i input.webm -af loudnorm=I=-16:TP=-1.5:LRA=7:measured_I=-8.23:measured_LRA=8.00:measured_TP=6.9:measured_thresh=-27.00:offset=0.10:linear=true:print_format=summary -ar 48k output.webm`

#### Automatically Normalize sound
`ffmpeg-normalize input.webm -o output.webm` (may fail depending on webm codecs - maybe convert to mp4 first)
This produces an mkv output and creates a directory called Normalize where it's placed automatically.
`ffmpeg-normalize *.webm -c:a aac -b:a 192k`

#### Handy other commands:
convert mkv/avi to webm (takes hours but makes it small):
`ffmpeg -i input.mkv output.webm`
`ffmpeg -i input.avi output.webm`

boost volume
`ffmpeg -i input.avi -filter:a "volume=15.6dB" output.webm`
`ffmpeg -i input.webm -filter:a "volume=11dB" output-new.webm`


#### Next Level Stuff
so i read this blog: https://medium.com/@jud.dagnall/dynamic-range-compression-for-audio-with-ffmpeg-and-compand-621fe2b1a892
It gives a more feature packed script to try:
`ffmpeg -i input.webm -filter_complex "compand=attacks=0:points=-80/-900|-45/-15|-27/-9|0/-7|20/-7:gain=5" output.webm`
