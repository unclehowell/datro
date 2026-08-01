"use strict";
(self["webpackChunkagentos_remotion"] = self["webpackChunkagentos_remotion"] || []).push([[179],{

/***/ 7179
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  ALL_FORMATS: () => (/* reexport */ input_format/* ALL_FORMATS */.XE),
  BufferSource: () => (/* reexport */ source/* BufferSource */._r),
  BufferTarget: () => (/* reexport */ target/* BufferTarget */.Sn),
  CanvasSource: () => (/* reexport */ media_source/* CanvasSource */.q2),
  Conversion: () => (/* reexport */ Conversion),
  Input: () => (/* reexport */ input/* Input */.pd),
  Output: () => (/* reexport */ output/* Output */.k7),
  WebMOutputFormat: () => (/* reexport */ output_format/* WebMOutputFormat */.wQ)
});

// UNUSED EXPORTS: ADTS, ALL_TRACK_TYPES, AUDIO_CODECS, AdtsInputFormat, AdtsOutputFormat, AppendOnlyStreamTarget, AttachedFile, AudioBufferSink, AudioBufferSource, AudioSample, AudioSampleResource, AudioSampleSink, AudioSampleSource, AudioSource, BaseMediaSampleSink, BlobSource, CanvasSink, CmafOutputFormat, ConcurrentRunner, ConversionCanceledError, CustomAudioDecoder, CustomAudioEncoder, CustomPathedSource, CustomSource, CustomVideoDecoder, CustomVideoEncoder, EncodedAudioPacketSource, EncodedPacket, EncodedPacketSink, EncodedVideoPacketSource, EventEmitter, FLAC, FilePathSource, FilePathTarget, FlacInputFormat, FlacOutputFormat, HLS, HLS_FORMATS, HlsInputFormat, HlsOutputFormat, InputAudioTrack, InputDisposedError, InputFormat, InputTrack, InputVideoTrack, IsobmffInputFormat, IsobmffOutputFormat, LogLevel, Logging, MATROSKA, MP3, MP4, MPEG_TS, MatroskaInputFormat, MediaSource, MediaStreamAudioTrackSource, MediaStreamVideoTrackSource, MkvOutputFormat, MovOutputFormat, Mp3InputFormat, Mp3OutputFormat, Mp4InputFormat, Mp4OutputFormat, MpegTsInputFormat, MpegTsOutputFormat, NON_PCM_AUDIO_CODECS, NullTarget, OGG, OggInputFormat, OggOutputFormat, OutputAudioTrack, OutputFormat, OutputSubtitleTrack, OutputTrack, OutputTrackGroup, OutputVideoTrack, PCM_AUDIO_CODECS, PathedSource, PathedTarget, QTFF, QUALITY_HIGH, QUALITY_LOW, QUALITY_MEDIUM, QUALITY_VERY_HIGH, QUALITY_VERY_LOW, Quality, QuickTimeInputFormat, RangedSource, RangedTarget, ReadableStreamSource, RichImageData, SUBTITLE_CODECS, Source, SourceRef, StreamSource, StreamTarget, SubtitleSource, Target, TextSubtitleSource, UnsupportedInputFormatError, UrlSource, VIDEO_CODECS, VIDEO_SAMPLE_PIXEL_FORMATS, VideoSample, VideoSampleColorSpace, VideoSampleResource, VideoSampleSink, VideoSampleSource, VideoSource, WAVE, WEBM, WavOutputFormat, WaveInputFormat, WebMInputFormat, asc, canDecode, canDecodeAudio, canDecodeVideo, canEncode, canEncodeAudio, canEncodeSubtitles, canEncodeVideo, desc, getDecodableAudioCodecs, getDecodableCodecs, getDecodableVideoCodecs, getEncodableAudioCodecs, getEncodableCodecs, getEncodableSubtitleCodecs, getEncodableVideoCodecs, getFirstEncodableAudioCodec, getFirstEncodableSubtitleCodec, getFirstEncodableVideoCodec, prefer, registerDecoder, registerEncoder, registerVideoSampleTransformer

// EXTERNAL MODULE: ./node_modules/mediabunny/dist/modules/src/logging.js
var logging = __webpack_require__(6103);
// EXTERNAL MODULE: ./node_modules/mediabunny/dist/modules/src/output.js
var output = __webpack_require__(9917);
// EXTERNAL MODULE: ./node_modules/mediabunny/dist/modules/src/output-format.js + 13 modules
var output_format = __webpack_require__(2697);
// EXTERNAL MODULE: ./node_modules/mediabunny/dist/modules/src/media-source.js + 1 modules
var media_source = __webpack_require__(2532);
// EXTERNAL MODULE: ./node_modules/mediabunny/dist/modules/src/target.js
var target = __webpack_require__(917);
// EXTERNAL MODULE: ./node_modules/mediabunny/dist/modules/src/source.js
var source = __webpack_require__(4709);
// EXTERNAL MODULE: ./node_modules/mediabunny/dist/modules/src/input-format.js + 12 modules
var input_format = __webpack_require__(1290);
// EXTERNAL MODULE: ./node_modules/mediabunny/dist/modules/src/input.js
var input = __webpack_require__(2030);
// EXTERNAL MODULE: ./node_modules/mediabunny/dist/modules/src/codec.js
var src_codec = __webpack_require__(1188);
// EXTERNAL MODULE: ./node_modules/mediabunny/dist/modules/src/encode.js
var encode = __webpack_require__(5374);
// EXTERNAL MODULE: ./node_modules/mediabunny/dist/modules/src/media-sink.js
var media_sink = __webpack_require__(388);
// EXTERNAL MODULE: ./node_modules/mediabunny/dist/modules/src/misc.js
var misc = __webpack_require__(3912);
// EXTERNAL MODULE: ./node_modules/mediabunny/dist/modules/src/sample.js
var src_sample = __webpack_require__(4166);
// EXTERNAL MODULE: ./node_modules/mediabunny/dist/modules/src/metadata.js
var metadata = __webpack_require__(5165);
;// ./node_modules/mediabunny/dist/modules/src/conversion.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */












const validateVideoOptions = (videoOptions) => {
    if (!videoOptions || typeof videoOptions !== 'object') {
        throw new TypeError('options.video, when provided, must be an object.');
    }
    if (videoOptions?.discard !== undefined && typeof videoOptions.discard !== 'boolean') {
        throw new TypeError('options.video.discard, when provided, must be a boolean.');
    }
    if (videoOptions?.forceTranscode !== undefined && typeof videoOptions.forceTranscode !== 'boolean') {
        throw new TypeError('options.video.forceTranscode, when provided, must be a boolean.');
    }
    if (videoOptions?.codec !== undefined && !src_codec/* VIDEO_CODECS */.WN.includes(videoOptions.codec)) {
        throw new TypeError(`options.video.codec, when provided, must be one of: ${src_codec/* VIDEO_CODECS */.WN.join(', ')}.`);
    }
    if (videoOptions?.bitrate !== undefined
        && !(videoOptions.bitrate instanceof encode/* Quality */.en)
        && (!Number.isInteger(videoOptions.bitrate) || videoOptions.bitrate <= 0)) {
        throw new TypeError('options.video.bitrate, when provided, must be a positive integer or a quality.');
    }
    if (videoOptions?.width !== undefined
        && (!Number.isInteger(videoOptions.width) || videoOptions.width <= 0)) {
        throw new TypeError('options.video.width, when provided, must be a positive integer.');
    }
    if (videoOptions?.height !== undefined
        && (!Number.isInteger(videoOptions.height) || videoOptions.height <= 0)) {
        throw new TypeError('options.video.height, when provided, must be a positive integer.');
    }
    if (videoOptions?.fit !== undefined && !['fill', 'contain', 'cover'].includes(videoOptions.fit)) {
        throw new TypeError('options.video.fit, when provided, must be one of \'fill\', \'contain\', or \'cover\'.');
    }
    if (videoOptions?.width !== undefined
        && videoOptions.height !== undefined
        && videoOptions.fit === undefined) {
        throw new TypeError('When both options.video.width and options.video.height are provided, options.video.fit must also be'
            + ' provided.');
    }
    if (videoOptions?.rotate !== undefined && ![0, 90, 180, 270].includes(videoOptions.rotate)) {
        throw new TypeError('options.video.rotate, when provided, must be 0, 90, 180 or 270.');
    }
    if (videoOptions?.allowRotationMetadata !== undefined && typeof videoOptions.allowRotationMetadata !== 'boolean') {
        throw new TypeError('options.video.allowRotationMetadata, when provided, must be a boolean.');
    }
    if (videoOptions?.crop !== undefined) {
        (0,src_sample/* validateCropRectangle */.wS)(videoOptions.crop, 'options.video.');
    }
    if (videoOptions?.frameRate !== undefined
        && (!Number.isFinite(videoOptions.frameRate) || videoOptions.frameRate <= 0)) {
        throw new TypeError('options.video.frameRate, when provided, must be a finite positive number.');
    }
    if (videoOptions?.alpha !== undefined && !['discard', 'keep'].includes(videoOptions.alpha)) {
        throw new TypeError('options.video.alpha, when provided, must be either \'discard\' or \'keep\'.');
    }
    if (videoOptions?.keyFrameInterval !== undefined
        && (!Number.isFinite(videoOptions.keyFrameInterval) || videoOptions.keyFrameInterval < 0)) {
        throw new TypeError('options.video.keyFrameInterval, when provided, must be a non-negative number.');
    }
    if (videoOptions?.process !== undefined && typeof videoOptions.process !== 'function') {
        throw new TypeError('options.video.process, when provided, must be a function.');
    }
    if (videoOptions?.processedWidth !== undefined
        && (!Number.isInteger(videoOptions.processedWidth) || videoOptions.processedWidth <= 0)) {
        throw new TypeError('options.video.processedWidth, when provided, must be a positive integer.');
    }
    if (videoOptions?.processedHeight !== undefined
        && (!Number.isInteger(videoOptions.processedHeight) || videoOptions.processedHeight <= 0)) {
        throw new TypeError('options.video.processedHeight, when provided, must be a positive integer.');
    }
    if (videoOptions?.hardwareAcceleration !== undefined
        && !['no-preference', 'prefer-hardware', 'prefer-software'].includes(videoOptions.hardwareAcceleration)) {
        throw new TypeError('options.video.hardwareAcceleration, when provided, must be \'no-preference\', \'prefer-hardware\' or'
            + ' \'prefer-software\'.');
    }
    if (videoOptions?.group !== undefined
        && !(videoOptions.group instanceof output/* OutputTrackGroup */.Q6
            || (Array.isArray(videoOptions.group) && videoOptions.group.every(x => x instanceof output/* OutputTrackGroup */.Q6)))) {
        throw new TypeError('options.video.group, when provided, must be an OutputTrackGroup or an array of OutputTrackGroups.');
    }
};
const validateAudioOptions = (audioOptions) => {
    if (!audioOptions || typeof audioOptions !== 'object') {
        throw new TypeError('options.audio, when provided, must be an object.');
    }
    if (audioOptions?.discard !== undefined && typeof audioOptions.discard !== 'boolean') {
        throw new TypeError('options.audio.discard, when provided, must be a boolean.');
    }
    if (audioOptions?.forceTranscode !== undefined && typeof audioOptions.forceTranscode !== 'boolean') {
        throw new TypeError('options.audio.forceTranscode, when provided, must be a boolean.');
    }
    if (audioOptions?.codec !== undefined && !src_codec/* AUDIO_CODECS */.PP.includes(audioOptions.codec)) {
        throw new TypeError(`options.audio.codec, when provided, must be one of: ${src_codec/* AUDIO_CODECS */.PP.join(', ')}.`);
    }
    if (audioOptions?.bitrate !== undefined
        && !(audioOptions.bitrate instanceof encode/* Quality */.en)
        && (!Number.isInteger(audioOptions.bitrate) || audioOptions.bitrate <= 0)) {
        throw new TypeError('options.audio.bitrate, when provided, must be a positive integer or a quality.');
    }
    if (audioOptions?.numberOfChannels !== undefined
        && (!Number.isInteger(audioOptions.numberOfChannels) || audioOptions.numberOfChannels <= 0)) {
        throw new TypeError('options.audio.numberOfChannels, when provided, must be a positive integer.');
    }
    if (audioOptions?.sampleRate !== undefined
        && (!Number.isInteger(audioOptions.sampleRate) || audioOptions.sampleRate <= 0)) {
        throw new TypeError('options.audio.sampleRate, when provided, must be a positive integer.');
    }
    if (audioOptions?.sampleFormat !== undefined
        && !['u8', 's16', 's32', 'f32'].includes(audioOptions.sampleFormat)) {
        throw new TypeError('options.audio.sampleFormat, when provided, must be one of: u8, s16, s32, f32.');
    }
    if (audioOptions?.process !== undefined && typeof audioOptions.process !== 'function') {
        throw new TypeError('options.audio.process, when provided, must be a function.');
    }
    if (audioOptions?.processedNumberOfChannels !== undefined
        && (!Number.isInteger(audioOptions.processedNumberOfChannels) || audioOptions.processedNumberOfChannels <= 0)) {
        throw new TypeError('options.audio.processedNumberOfChannels, when provided, must be a positive integer.');
    }
    if (audioOptions?.processedSampleRate !== undefined
        && (!Number.isInteger(audioOptions.processedSampleRate) || audioOptions.processedSampleRate <= 0)) {
        throw new TypeError('options.audio.processedSampleRate, when provided, must be a positive integer.');
    }
    if (audioOptions?.group !== undefined
        && !(audioOptions.group instanceof output/* OutputTrackGroup */.Q6
            || (Array.isArray(audioOptions.group) && audioOptions.group.every(x => x instanceof output/* OutputTrackGroup */.Q6)))) {
        throw new TypeError('options.audio.group, when provided, must be an OutputTrackGroup or an array of OutputTrackGroups.');
    }
};
const FALLBACK_NUMBER_OF_CHANNELS = 2;
const FALLBACK_SAMPLE_RATE = 48000;
/**
 * Represents a media file conversion process, used to convert one media file into another. In addition to conversion,
 * this class can be used to resize and rotate video, resample audio, drop tracks, or trim to a specific time range.
 * @group Conversion
 * @public
 */
class Conversion {
    /** Initializes a new conversion process without starting the conversion. */
    static async init(options) {
        const conversion = new Conversion(options);
        await conversion._init();
        return conversion;
    }
    /** Creates a new Conversion instance (duh). */
    constructor(options) {
        /** @internal */
        this._addedCounts = {
            video: 0,
            audio: 0,
            subtitle: 0,
        };
        /** @internal */
        this._totalTrackCount = 0;
        /** @internal */
        this._nextOutputTrackId = 0;
        /** @internal */
        this._outputTrackIds = [];
        /** @internal */
        this._outputOwnTrackGroups = [];
        /** @internal */
        this._trackPromises = [];
        /** @internal */
        this._executed = false;
        /** @internal */
        this._synchronizer = new TrackSynchronizer();
        /** @internal */
        this._totalDuration = null;
        /** @internal */
        this._maxTimestamps = new Map(); // Track ID -> timestamp
        /** @internal */
        this._canceled = false;
        /**
         * A callback that is fired whenever the conversion progresses. Gets passed as first argument a number between
         * 0 and 1, indicating the completion of the conversion. Note that a progress of 1 doesn't necessarily mean the
         * conversion is complete; the conversion is complete once `execute()` resolves.
         *
         * As second argument, this callback receives the input time in seconds that has been processed.
         *
         * In order for progress to be computed, this property must be set before `execute` is called.
         */
        this.onProgress = undefined;
        /** @internal */
        this._computeProgress = false;
        /** @internal */
        this._lastProgress = 0;
        /**
         * Whether this conversion, as it has been configured, is valid and can be executed. If this field is `false`, check
         * the `discardedTracks` field for reasons.
         *
         * Note: a conversion having discarded tracks does not automatically mean it is invalid; if the remaining, utilized
         * tracks make for a valid output file, the conversion is still allowed.
         */
        this.isValid = false;
        /**
         * The list of tracks that are included in the output file. When fan-out is used, the same track appears in this
         * array multiple times.
         */
        this.utilizedTracks = [];
        /** The list of tracks from the input file that have been discarded, alongside the discard reason. */
        this.discardedTracks = [];
        if (!options || typeof options !== 'object') {
            throw new TypeError('options must be an object.');
        }
        if (!(options.input instanceof input/* Input */.pd)) {
            throw new TypeError('options.input must be an Input.');
        }
        if (!(options.output instanceof output/* Output */.k7)) {
            throw new TypeError('options.output must be an Output.');
        }
        if (options.tracks !== undefined
            && options.tracks !== 'all'
            && options.tracks !== 'primary') {
            throw new TypeError('options.tracks, when provided, must be either \'all\' or \'primary\'.');
        }
        if (options.output._tracks.length > 0
            || Object.keys(options.output._metadataTags).length > 0
            || options.output.state !== 'pending') {
            throw new TypeError('options.output must be fresh: no tracks or metadata tags added and not started.');
        }
        if (options.video !== undefined && typeof options.video !== 'function') {
            if (Array.isArray(options.video)) {
                for (const obj of options.video) {
                    validateVideoOptions(obj);
                }
            }
            else {
                validateVideoOptions(options.video);
            }
        }
        else {
            // We'll validate the return value later
        }
        if (options.audio !== undefined && typeof options.audio !== 'function') {
            if (Array.isArray(options.audio)) {
                for (const obj of options.audio) {
                    validateAudioOptions(obj);
                }
            }
            else {
                validateAudioOptions(options.audio);
            }
        }
        else {
            // We'll validate the return value later
        }
        if (options.trim !== undefined && (!options.trim || typeof options.trim !== 'object')) {
            throw new TypeError('options.trim, when provided, must be an object.');
        }
        if (options.trim?.start !== undefined && (!Number.isFinite(options.trim.start))) {
            throw new TypeError('options.trim.start, when provided, must be a finite number.');
        }
        if (options.trim?.end !== undefined && (!Number.isFinite(options.trim.end))) {
            throw new TypeError('options.trim.end, when provided, must be a finite number.');
        }
        if (options.trim?.start !== undefined
            && options.trim.end !== undefined
            && options.trim.start >= options.trim.end) {
            throw new TypeError('options.trim.start must be less than options.trim.end.');
        }
        if (options.tags !== undefined
            && (typeof options.tags !== 'object' || !options.tags)
            && typeof options.tags !== 'function') {
            throw new TypeError('options.tags, when provided, must be an object or a function.');
        }
        if (typeof options.tags === 'object') {
            (0,metadata/* validateMetadataTags */.VD)(options.tags);
        }
        if (options.showWarnings !== undefined && typeof options.showWarnings !== 'boolean') {
            throw new TypeError('options.showWarnings, when provided, must be a boolean.');
        }
        this._options = options;
        this.input = options.input;
        this.output = options.output;
        const { promise: started, resolve: start } = (0,misc/* promiseWithResolvers */.nJ)();
        this._started = started;
        this._start = start;
    }
    /** @internal */
    async _init() {
        const inputFormat = await this.input.getFormat();
        let tracks;
        let trackMode = this._options.tracks;
        if (trackMode === undefined) {
            // HACK to keep bundle size low, temp for now
            const defaultTrackMode = inputFormat.name.includes('(HLS)')
                ? 'primary'
                : 'all';
            trackMode = defaultTrackMode;
        }
        if (trackMode === 'all') {
            tracks = await this.input.getTracks();
        }
        else if (trackMode === 'primary') {
            const primaryVideoTrack = await this.input.getPrimaryVideoTrack();
            const primaryAudioTrack = await this.input.getPrimaryAudioTrack();
            tracks = [primaryVideoTrack, primaryAudioTrack].filter(x => x !== null);
        }
        else {
            (0,misc/* assertNever */.xb)(trackMode);
            (0,misc/* assert */.vA)(false);
        }
        const outputTrackCounts = this.output.format.getSupportedTrackCounts();
        // Input track counters
        let nVideo = 1;
        let nAudio = 1;
        // All tracks that aren't discarded by the user
        const filteredTracks = [];
        const filteredTrackOptions = [];
        for (const track of tracks) {
            let trackOptions;
            if (track.isVideoTrack()) {
                if (this._options.video) {
                    if (typeof this._options.video === 'function') {
                        const returnedTrackOptions = await this._options.video(track, nVideo) ?? {};
                        if (Array.isArray(returnedTrackOptions)) {
                            for (const obj of returnedTrackOptions) {
                                validateVideoOptions(obj);
                            }
                        }
                        else {
                            validateVideoOptions(returnedTrackOptions);
                        }
                        trackOptions = Array.isArray(returnedTrackOptions)
                            ? returnedTrackOptions
                            : [returnedTrackOptions];
                        nVideo++;
                    }
                    else {
                        // Already validated
                        trackOptions = Array.isArray(this._options.video)
                            ? this._options.video
                            : [this._options.video];
                    }
                }
                else {
                    trackOptions = [{}];
                }
            }
            else if (track.isAudioTrack()) {
                if (this._options.audio) {
                    if (typeof this._options.audio === 'function') {
                        const returnedTrackOptions = await this._options.audio(track, nAudio) ?? {};
                        if (Array.isArray(returnedTrackOptions)) {
                            for (const obj of returnedTrackOptions) {
                                validateAudioOptions(obj);
                            }
                        }
                        else {
                            validateAudioOptions(returnedTrackOptions);
                        }
                        trackOptions = Array.isArray(returnedTrackOptions)
                            ? returnedTrackOptions
                            : [returnedTrackOptions];
                        nAudio++;
                    }
                    else {
                        // Already validated
                        trackOptions = Array.isArray(this._options.audio)
                            ? this._options.audio
                            : [this._options.audio];
                    }
                }
                else {
                    trackOptions = [{}];
                }
            }
            else {
                (0,misc/* assert */.vA)(false);
            }
            const discardOptions = trackOptions.filter(x => x.discard);
            for (const discardOption of discardOptions) {
                this.discardedTracks.push({
                    track,
                    reason: 'discarded_by_user',
                    trackOptions: discardOption,
                });
            }
            if (trackOptions.length === discardOptions.length) {
                if (trackOptions.length === 0) {
                    this.discardedTracks.push({
                        track,
                        reason: 'discarded_by_user',
                        trackOptions: {},
                    });
                }
                continue;
            }
            const nonDiscardOptions = trackOptions.filter(x => !x.discard);
            filteredTracks.push(track);
            filteredTrackOptions.push(nonDiscardOptions);
        }
        if (this._options.trim?.start !== undefined) {
            this._startTimestamp = this._options.trim.start;
        }
        else {
            // Compute the start timestamp from the set of filtered tracks. Technically these can still be narrowed
            // down later due to discarded tracks, but we need to fix the start timestamp now due to track processing
            // depending on it.
            this._startTimestamp = Math.max(await this.input.getFirstTimestamp(filteredTracks), 
            // Samples can also have negative timestamps, but the meaning typically is "don't present me", so let's
            // cut those out by default.
            0);
        }
        this._endTimestamp = Math.max(this._options.trim?.end ?? Infinity, this._startTimestamp);
        // Run these sequentially so that output tracks have a deterministic order
        for (let i = 0; i < filteredTracks.length; i++) {
            const track = filteredTracks[i];
            const options = filteredTrackOptions[i];
            for (const option of options) {
                if (this._totalTrackCount === outputTrackCounts.total.max) {
                    this.discardedTracks.push({
                        track,
                        reason: 'max_track_count_reached',
                        trackOptions: option,
                    });
                    continue;
                }
                if (this._addedCounts[track.type] === outputTrackCounts[track.type].max) {
                    this.discardedTracks.push({
                        track,
                        reason: 'max_track_count_of_type_reached',
                        trackOptions: option,
                    });
                    continue;
                }
                const outputTrackId = this._nextOutputTrackId++;
                if (track.isVideoTrack()) {
                    await this._processVideoTrack(track, option, outputTrackId);
                }
                else if (track.isAudioTrack()) {
                    await this._processAudioTrack(track, option, outputTrackId);
                }
                else {
                    (0,misc/* assert */.vA)(false);
                }
            }
        }
        // When no track groups are set by the user, then the output track pairability should be *identical* to the
        // input's. We do the naive algorithm to achieve this: assign each track to its own group, and pair groups with
        // each other based on input track pairability.
        for (let i = 0; i < this.utilizedTracks.length - 1; i++) {
            for (let j = i + 1; j < this.utilizedTracks.length; j++) {
                const trackA = this.utilizedTracks[i];
                const trackB = this.utilizedTracks[j];
                const ownGroupA = this._outputOwnTrackGroups[i];
                const ownGroupB = this._outputOwnTrackGroups[j];
                (0,misc/* assert */.vA)(ownGroupA !== undefined);
                (0,misc/* assert */.vA)(ownGroupB !== undefined);
                if (ownGroupA && ownGroupB && trackA.canBePairedWith(trackB)) {
                    ownGroupA.pairWith(ownGroupB);
                }
            }
        }
        // Now, let's deal with metadata tags
        const inputTags = await this.input.getMetadataTags();
        let outputTags;
        if (this._options.tags) {
            const result = typeof this._options.tags === 'function'
                ? await this._options.tags(inputTags)
                : this._options.tags;
            (0,metadata/* validateMetadataTags */.VD)(result);
            outputTags = result;
        }
        else {
            outputTags = inputTags;
        }
        // Somewhat dirty but pragmatic
        const inputAndOutputFormatMatch = inputFormat.mimeType === this.output.format.mimeType;
        const rawTagsAreUnchanged = inputTags.raw === outputTags.raw;
        if (inputTags.raw && rawTagsAreUnchanged && !inputAndOutputFormatMatch) {
            // If the input and output formats aren't the same, copying over raw metadata tags makes no sense and only
            // results in junk tags, so let's cut them out.
            delete outputTags.raw;
        }
        this.output.setMetadataTags(outputTags);
        // Let's check if the conversion can actually be executed
        this.isValid = this._totalTrackCount >= outputTrackCounts.total.min
            && this._addedCounts.video >= outputTrackCounts.video.min
            && this._addedCounts.audio >= outputTrackCounts.audio.min
            && this._addedCounts.subtitle >= outputTrackCounts.subtitle.min;
        if (this._options.showWarnings ?? true) {
            const warnElements = [];
            const unintentionallyDiscardedTracks = this.discardedTracks.filter(x => x.reason !== 'discarded_by_user');
            if (unintentionallyDiscardedTracks.length > 0) {
                // Let's give the user a notice/warning about discarded tracks so they aren't confused
                warnElements.push('Some tracks had to be discarded from the conversion:', unintentionallyDiscardedTracks);
            }
            if (!this.isValid) {
                if (warnElements.length > 0) {
                    warnElements.push('\n\n');
                }
                warnElements.push(this._getInvalidityExplanation().join(''));
            }
            if (warnElements.length > 0) {
                logging/* Logging */.y._warn(...warnElements);
            }
        }
    }
    /** @internal */
    _getInvalidityExplanation() {
        const elements = [];
        if (this.discardedTracks.length === 0) {
            elements.push('Due to missing tracks, this conversion cannot be executed.');
        }
        else {
            const encodabilityIsTheProblem = this.discardedTracks.every(x => x.reason === 'discarded_by_user' || x.reason === 'no_encodable_target_codec') && this.discardedTracks.some(x => x.reason === 'no_encodable_target_codec');
            elements.push('Due to discarded tracks, this conversion cannot be executed.');
            if (encodabilityIsTheProblem) {
                const codecs = this.discardedTracks.flatMap((x) => {
                    if (x.reason === 'discarded_by_user')
                        return [];
                    if (x.track.type === 'video') {
                        return this.output.format.getSupportedVideoCodecs();
                    }
                    else if (x.track.type === 'audio') {
                        return this.output.format.getSupportedAudioCodecs();
                    }
                    else {
                        return this.output.format.getSupportedSubtitleCodecs();
                    }
                });
                const uniqueCodecs = [...new Set(codecs)];
                if (uniqueCodecs.length === 1) {
                    elements.push(`\nTracks were discarded because your environment is not able to encode '${uniqueCodecs[0]}'.`);
                }
                else {
                    elements.push('\nTracks were discarded because your environment is not able to encode any of the following'
                        + ` codecs: ${uniqueCodecs.map(x => `'${x}'`).join(', ')}.`);
                }
                if (uniqueCodecs.includes('mp3')) {
                    elements.push(`\nThe @mediabunny/mp3-encoder extension package provides support for encoding MP3.`);
                }
                if (uniqueCodecs.includes('aac')) {
                    elements.push('\nThe @mediabunny/aac-encoder extension package provides support for encoding AAC.');
                }
                if (uniqueCodecs.includes('ac3') || uniqueCodecs.includes('eac3')) {
                    elements.push('\nThe @mediabunny/ac3 extension package provides support'
                        + ' for encoding and decoding AC-3/E-AC-3.');
                }
                if (uniqueCodecs.includes('flac')) {
                    elements.push('\nThe @mediabunny/flac-encoder extension package provides support for encoding FLAC.');
                }
            }
            else {
                elements.push('\nCheck the discardedTracks field for more info.');
            }
        }
        return elements;
    }
    /**
     * Executes the conversion process. Resolves once conversion is complete.
     *
     * Will throw if `isValid` is `false`.
     */
    async execute() {
        if (!this.isValid) {
            throw new Error('Cannot execute this conversion because its output configuration is invalid. Make sure to always check'
                + ' the isValid field before executing a conversion.\n'
                + this._getInvalidityExplanation().join(''));
        }
        if (this._executed) {
            throw new Error('Conversion cannot be executed twice.');
        }
        this._executed = true;
        for (const id of this._outputTrackIds) {
            this._synchronizer.declareTrack(id);
        }
        if (this.onProgress) {
            // Compute duration using only the utilized tracks
            const uniqueUtilizedTracks = new Set(this.utilizedTracks);
            const durationPromises = [...uniqueUtilizedTracks].map(async (track) => {
                if (await track.isLive()) {
                    return Infinity; // Upper bound (assuming no universe heat death)
                }
                return (await track.getDurationFromMetadata()) ?? (await track.computeDuration());
            });
            const duration = Math.max(0, ...await Promise.all(durationPromises));
            this._computeProgress = true;
            this._totalDuration = Math.min(duration - this._startTimestamp, this._endTimestamp - this._startTimestamp);
            for (const id of this._outputTrackIds) {
                this._maxTimestamps.set(id, 0);
            }
            this.onProgress?.(0, 0);
        }
        await this.output.start();
        this._start();
        try {
            await Promise.all(this._trackPromises);
        }
        catch (error) {
            if (!this._canceled) {
                // Make sure to cancel to stop other encoding processes and clean up resources
                void this.cancel();
            }
            throw error;
        }
        if (this._canceled) {
            throw new ConversionCanceledError();
        }
        await this.output.finalize();
        if (this._computeProgress) {
            const minTimestamp = Math.min(...this._maxTimestamps.values());
            this.onProgress?.(1, minTimestamp);
        }
    }
    /**
     * Cancels the conversion process, causing any ongoing `execute` call to throw a `ConversionCanceledError`.
     * Does nothing if the conversion is already complete.
     */
    async cancel() {
        if (this.output.state === 'finalizing' || this.output.state === 'finalized') {
            return;
        }
        if (this._canceled) {
            logging/* Logging */.y._warn('Conversion already canceled.');
            return;
        }
        this._canceled = true;
        await this.output.cancel();
    }
    /** @internal */
    async _processVideoTrack(track, trackOptions, outputTrackId) {
        const sourceCodec = await track.getCodec();
        if (!sourceCodec) {
            this.discardedTracks.push({
                track,
                reason: 'unknown_source_codec',
                trackOptions,
            });
            return;
        }
        let videoSource;
        const innateRotation = await track.getRotation();
        const totalRotation = (0,misc/* normalizeRotation */.qT)(innateRotation + (trackOptions.rotate ?? 0));
        let outputTrackRotation = totalRotation;
        const canUseRotationMetadata = this.output.format.supportsVideoRotationMetadata
            && (trackOptions.allowRotationMetadata ?? true);
        const squarePixelWidth = await track.getSquarePixelWidth();
        const squarePixelHeight = await track.getSquarePixelHeight();
        const [rotatedWidth, rotatedHeight] = totalRotation % 180 === 0
            ? [squarePixelWidth, squarePixelHeight]
            : [squarePixelHeight, squarePixelWidth];
        let crop = trackOptions.crop;
        if (crop) {
            crop = (0,src_sample/* clampCropRectangle */.px)(crop, rotatedWidth, rotatedHeight);
        }
        const [originalWidth, originalHeight] = crop
            ? [crop.width, crop.height]
            : [rotatedWidth, rotatedHeight];
        let width = originalWidth;
        let height = originalHeight;
        const aspectRatio = width / height;
        // A lot of video encoders require that the dimensions be multiples of 2
        if (trackOptions.width !== undefined && trackOptions.height === undefined) {
            width = (0,misc/* ceilToMultipleOfTwo */._x)(trackOptions.width);
            height = (0,misc/* ceilToMultipleOfTwo */._x)(Math.round(width / aspectRatio));
        }
        else if (trackOptions.width === undefined && trackOptions.height !== undefined) {
            height = (0,misc/* ceilToMultipleOfTwo */._x)(trackOptions.height);
            width = (0,misc/* ceilToMultipleOfTwo */._x)(Math.round(height * aspectRatio));
        }
        else if (trackOptions.width !== undefined && trackOptions.height !== undefined) {
            width = (0,misc/* ceilToMultipleOfTwo */._x)(trackOptions.width);
            height = (0,misc/* ceilToMultipleOfTwo */._x)(trackOptions.height);
        }
        const firstTimestamp = await track.getFirstTimestamp();
        let videoCodecs = this.output.format.getSupportedVideoCodecs();
        const needsTranscode = !!trackOptions.forceTranscode
            || firstTimestamp < this._startTimestamp
            || !!trackOptions.frameRate
            || trackOptions.keyFrameInterval !== undefined
            || trackOptions.process !== undefined
            || trackOptions.bitrate !== undefined
            || !videoCodecs.includes(sourceCodec)
            || (trackOptions.codec && trackOptions.codec !== sourceCodec)
            || width !== originalWidth
            || height !== originalHeight
            // TODO This is suboptimal: Forcing a rerender when both rotation and process are set is not
            // performance-optimal, but right now there's no other way because we can't change the track rotation
            // metadata after the output has already started. Should be possible with API changes in v2, though!
            || (totalRotation !== 0 && !canUseRotationMetadata)
            || !!crop;
        const alpha = trackOptions.alpha ?? 'discard';
        if (!needsTranscode) {
            // Fast path, we can simply copy over the encoded packets
            const source = new media_source/* EncodedVideoPacketSource */.pO(sourceCodec);
            videoSource = source;
            this._trackPromises.push((async () => {
                await this._started;
                const sink = new media_sink/* EncodedPacketSink */.kQ(track);
                const decoderConfig = await track.getDecoderConfig();
                const meta = { decoderConfig: decoderConfig ?? undefined };
                for await (const packet of sink.packets(undefined, undefined, { verifyKeyPackets: true })) {
                    if (this._canceled) {
                        return;
                    }
                    if (packet.timestamp >= this._endTimestamp) {
                        break;
                    }
                    const modifiedPacket = packet.clone({
                        timestamp: packet.timestamp - this._startTimestamp,
                        sideData: alpha === 'discard'
                            ? {} // Remove alpha side data
                            : packet.sideData,
                    });
                    (0,misc/* assert */.vA)(modifiedPacket.timestamp >= 0);
                    this._reportProgress(outputTrackId, modifiedPacket.timestamp + modifiedPacket.duration);
                    await source.add(modifiedPacket, meta);
                    if (this._synchronizer.shouldWait(outputTrackId, modifiedPacket.timestamp)) {
                        await this._synchronizer.wait(modifiedPacket.timestamp);
                    }
                }
                source.close();
                this._synchronizer.closeTrack(outputTrackId);
            })());
        }
        else {
            // We need to decode & reencode the video
            const canDecode = await track.canDecode();
            if (!canDecode) {
                this.discardedTracks.push({
                    track,
                    reason: 'undecodable_source_codec',
                    trackOptions,
                });
                return;
            }
            if (trackOptions.codec) {
                videoCodecs = videoCodecs.filter(codec => codec === trackOptions.codec);
            }
            const bitrate = trackOptions.bitrate ?? encode/* QUALITY_HIGH */.pr;
            const encodableCodec = await (0,encode/* getFirstEncodableVideoCodec */.Tn)(videoCodecs, {
                width: trackOptions.process && trackOptions.processedWidth
                    ? trackOptions.processedWidth
                    : width,
                height: trackOptions.process && trackOptions.processedHeight
                    ? trackOptions.processedHeight
                    : height,
                bitrate,
            });
            if (!encodableCodec) {
                this.discardedTracks.push({
                    track,
                    reason: 'no_encodable_target_codec',
                    trackOptions,
                });
                return;
            }
            const encodingConfig = {
                codec: encodableCodec,
                bitrate,
                keyFrameInterval: trackOptions.keyFrameInterval,
                sizeChangeBehavior: trackOptions.fit ?? 'passThrough',
                alpha,
                hardwareAcceleration: trackOptions.hardwareAcceleration,
                transform: {},
            };
            (0,misc/* assert */.vA)(encodingConfig.transform);
            let needsRerender = width !== originalWidth
                || height !== originalHeight
                || (totalRotation !== 0 && (!canUseRotationMetadata || trackOptions.process !== undefined))
                || !!crop
                // Don't expect encoders to reliably handle non-square pixels:
                || squarePixelWidth !== await track.getCodedWidth()
                || squarePixelHeight !== await track.getCodedHeight();
            if (!needsRerender) {
                // If we're directly passing decoded samples back to the encoder, sometimes the encoder may error due
                // to lack of support of certain video frame formats, like when HDR is at play. To check for this, we
                // first try to pass a single frame to the encoder to see how it behaves. If it throws, we then fall
                // back to the rerender path.
                //
                // Creating a new temporary Output is sort of hacky, but due to a lack of an isolated encoder API right
                // now, this is the simplest way. Will refactor in the future! TODO
                const tempOutput = new output/* Output */.k7({
                    format: new output_format/* Mp4OutputFormat */.si(), // Supports all video codecs
                    target: new target/* NullTarget */.D$(),
                });
                const tempSource = new media_source/* VideoSampleSource */.Fl(encodingConfig);
                tempOutput.addVideoTrack(tempSource);
                await tempOutput.start();
                const sink = new media_sink/* VideoSampleSink */.lc(track);
                const firstSample = await sink.getSample(firstTimestamp); // Let's just use the first sample
                if (firstSample) {
                    try {
                        await tempSource.add(firstSample);
                        firstSample.close();
                        await tempOutput.finalize();
                    }
                    catch (error) {
                        logging/* Logging */.y._warn('An error occurred when probing encoder support. Falling back to rerender path.', error);
                        void tempOutput.cancel();
                        needsRerender = true;
                        encodingConfig.transform.force = true;
                    }
                }
                else {
                    await tempOutput.cancel();
                }
            }
            if (trackOptions.frameRate) {
                encodingConfig.transform.frameRate = trackOptions.frameRate;
            }
            if (trackOptions.process) {
                encodingConfig.transform.process = trackOptions.process;
            }
            if (needsRerender) {
                outputTrackRotation = 0; // Since the rotation is baked into the output
                encodingConfig.transform.width = width;
                encodingConfig.transform.height = height;
                encodingConfig.transform.fit = trackOptions.fit ?? 'fill';
                encodingConfig.transform.rotate = (0,misc/* normalizeRotation */.qT)(totalRotation - innateRotation);
                encodingConfig.transform.crop = crop;
                encodingConfig.transform.alpha = alpha;
            }
            // We need to do this because `process` can emit new timestamps
            let lastSampleTimestamp = null;
            encodingConfig.onEncodedSample = (sample) => {
                lastSampleTimestamp = sample.timestamp;
            };
            const source = new media_source/* VideoSampleSource */.Fl(encodingConfig);
            videoSource = source;
            this._trackPromises.push((async () => {
                await this._started;
                const sink = new media_sink/* VideoSampleSink */.lc(track);
                for await (const sample of sink.samples(this._startTimestamp, this._endTimestamp)) {
                    if (this._canceled) {
                        sample.close();
                        return;
                    }
                    const adjustedSampleTimestamp = Math.max(sample.timestamp - this._startTimestamp, 0);
                    sample.setTimestamp(adjustedSampleTimestamp);
                    this._reportProgress(outputTrackId, sample.timestamp + sample.duration);
                    await source.add(sample);
                    if (lastSampleTimestamp !== null) {
                        if (this._synchronizer.shouldWait(outputTrackId, lastSampleTimestamp)) {
                            await this._synchronizer.wait(lastSampleTimestamp);
                        }
                    }
                    sample.close();
                }
                source.close();
                this._synchronizer.closeTrack(outputTrackId);
            })());
        }
        let ownGroup = null;
        if (!trackOptions.group) {
            ownGroup = new output/* OutputTrackGroup */.Q6();
        }
        const videoTrackLanguageCode = await track.getLanguageCode();
        this.output.addVideoTrack(videoSource, {
            frameRate: trackOptions.frameRate,
            // TODO: This condition can be removed when all demuxers properly homogenize to BCP47 in v2
            languageCode: (0,misc/* isIso639Dash2LanguageCode */.Nu)(videoTrackLanguageCode) ? videoTrackLanguageCode : undefined,
            name: await track.getName() ?? undefined,
            disposition: await track.getDisposition(),
            rotation: outputTrackRotation,
            group: ownGroup ?? trackOptions.group,
        });
        this._addedCounts.video++;
        this._totalTrackCount++;
        this.utilizedTracks.push(track);
        this._outputTrackIds.push(outputTrackId);
        this._outputOwnTrackGroups.push(ownGroup);
    }
    /** @internal */
    async _processAudioTrack(track, trackOptions, outputTrackId) {
        const sourceCodec = await track.getCodec();
        if (!sourceCodec) {
            this.discardedTracks.push({
                track,
                reason: 'unknown_source_codec',
                trackOptions,
            });
            return;
        }
        let audioSource;
        const originalNumberOfChannels = await track.getNumberOfChannels();
        const originalSampleRate = await track.getSampleRate();
        const firstTimestamp = await track.getFirstTimestamp();
        let numberOfChannels = trackOptions.numberOfChannels ?? originalNumberOfChannels;
        let sampleRate = trackOptions.sampleRate ?? originalSampleRate;
        const needsTrimming = firstTimestamp < this._startTimestamp;
        let needsPadding = firstTimestamp > this._startTimestamp && !this.output.format.supportsTimestampedMediaData;
        let audioCodecs = this.output.format.getSupportedAudioCodecs();
        if (!trackOptions.forceTranscode
            && !trackOptions.bitrate
            && numberOfChannels === originalNumberOfChannels
            && sampleRate === originalSampleRate
            && !needsTrimming
            && !needsPadding
            && audioCodecs.includes(sourceCodec)
            && (!trackOptions.codec || trackOptions.codec === sourceCodec)
            && !trackOptions.process
            && trackOptions.sampleFormat === undefined) {
            // Fast path, we can simply copy over the encoded packets
            const source = new media_source/* EncodedAudioPacketSource */.m(sourceCodec);
            audioSource = source;
            this._trackPromises.push((async () => {
                await this._started;
                const sink = new media_sink/* EncodedPacketSink */.kQ(track);
                const decoderConfig = await track.getDecoderConfig();
                const meta = { decoderConfig: decoderConfig ?? undefined };
                for await (const packet of sink.packets()) {
                    if (this._canceled) {
                        return;
                    }
                    if (packet.timestamp >= this._endTimestamp) {
                        break;
                    }
                    const modifiedPacket = packet.clone({
                        timestamp: packet.timestamp - this._startTimestamp,
                    });
                    (0,misc/* assert */.vA)(modifiedPacket.timestamp >= 0);
                    this._reportProgress(outputTrackId, modifiedPacket.timestamp + modifiedPacket.duration);
                    await source.add(modifiedPacket, meta);
                    if (this._synchronizer.shouldWait(outputTrackId, modifiedPacket.timestamp)) {
                        await this._synchronizer.wait(modifiedPacket.timestamp);
                    }
                }
                source.close();
                this._synchronizer.closeTrack(outputTrackId);
            })());
        }
        else {
            // We need to decode & reencode the audio
            const canDecode = await track.canDecode();
            if (!canDecode) {
                this.discardedTracks.push({
                    track,
                    reason: 'undecodable_source_codec',
                    trackOptions,
                });
                return;
            }
            let codecOfChoice = null;
            if (trackOptions.codec) {
                audioCodecs = audioCodecs.filter(codec => codec === trackOptions.codec);
            }
            const bitrate = trackOptions.bitrate ?? encode/* QUALITY_HIGH */.pr;
            const encodableCodecs = await (0,encode/* getEncodableAudioCodecs */.Xq)(audioCodecs, {
                numberOfChannels: trackOptions.process && trackOptions.processedNumberOfChannels
                    ? trackOptions.processedNumberOfChannels
                    : numberOfChannels,
                sampleRate: trackOptions.process && trackOptions.processedSampleRate
                    ? trackOptions.processedSampleRate
                    : sampleRate,
                bitrate,
            });
            if (!encodableCodecs.some(codec => src_codec/* NON_PCM_AUDIO_CODECS */.YB.includes(codec))
                && audioCodecs.some(codec => src_codec/* NON_PCM_AUDIO_CODECS */.YB.includes(codec))
                && (numberOfChannels !== FALLBACK_NUMBER_OF_CHANNELS || sampleRate !== FALLBACK_SAMPLE_RATE)) {
                // We could not find a compatible non-PCM codec despite the container supporting them. This can be
                // caused by strange channel count or sample rate configurations. Therefore, let's try again but with
                // fallback parameters.
                const encodableCodecsWithDefaultParams = await (0,encode/* getEncodableAudioCodecs */.Xq)(audioCodecs, {
                    numberOfChannels: FALLBACK_NUMBER_OF_CHANNELS,
                    sampleRate: FALLBACK_SAMPLE_RATE,
                    bitrate,
                });
                const nonPcmCodec = encodableCodecsWithDefaultParams
                    .find(codec => src_codec/* NON_PCM_AUDIO_CODECS */.YB.includes(codec));
                if (nonPcmCodec) {
                    // We are able to encode using a non-PCM codec, but it'll require resampling
                    codecOfChoice = nonPcmCodec;
                    numberOfChannels = FALLBACK_NUMBER_OF_CHANNELS;
                    sampleRate = FALLBACK_SAMPLE_RATE;
                }
            }
            else {
                codecOfChoice = encodableCodecs[0] ?? null;
            }
            if (codecOfChoice === null) {
                this.discardedTracks.push({
                    track,
                    reason: 'no_encodable_target_codec',
                    trackOptions,
                });
                return;
            }
            const encodingConfig = {
                codec: codecOfChoice,
                bitrate,
                transform: {
                    sampleFormat: trackOptions.sampleFormat,
                    process: trackOptions.process,
                },
            };
            (0,misc/* assert */.vA)(encodingConfig.transform);
            if (numberOfChannels !== originalNumberOfChannels) {
                encodingConfig.transform.numberOfChannels = numberOfChannels;
            }
            if (sampleRate !== originalSampleRate) {
                encodingConfig.transform.sampleRate = sampleRate;
            }
            let lastSampleTimestamp = null;
            encodingConfig.onEncodedSample = (sample) => {
                lastSampleTimestamp = sample.timestamp;
            };
            const source = new media_source/* AudioSampleSource */.Ii(encodingConfig);
            audioSource = source;
            this._trackPromises.push((async () => {
                await this._started;
                const sink = new media_sink/* AudioSampleSink */.qw(track);
                for await (let sample of sink.samples(this._startTimestamp, this._endTimestamp)) {
                    if (this._canceled) {
                        sample.close();
                        return;
                    }
                    if (needsPadding) {
                        // Add one padding sample at the beginning
                        const paddingLength = firstTimestamp - this._startTimestamp;
                        const paddingLengthSamples = Math.round(paddingLength * originalSampleRate);
                        const bytesPerSample = (0,src_sample/* getBytesPerSample */.Dw)(sample.format);
                        const data = new Uint8Array(bytesPerSample * paddingLengthSamples * originalNumberOfChannels);
                        if (sample.format === 'u8' || sample.format === 'u8-planar') {
                            data.fill(2 ** 7); // Fill it with the silent value
                        }
                        const silentSample = new src_sample/* AudioSample */.B1({
                            data,
                            // Use the same format the decoder is spitting out. This avoids feeding changing sample
                            // formats to the audio encoder.
                            format: sample.format,
                            numberOfChannels: originalNumberOfChannels,
                            sampleRate: originalSampleRate,
                            timestamp: 0,
                        });
                        await this._registerAudioSample(silentSample, source, outputTrackId, () => lastSampleTimestamp);
                        needsPadding = false;
                    }
                    let startFrame = 0;
                    let endFrame = sample.numberOfFrames;
                    if (sample.timestamp < this._startTimestamp) {
                        startFrame = Math.round((this._startTimestamp - sample.timestamp) * sample.sampleRate);
                    }
                    if (sample.timestamp + sample.duration > this._endTimestamp) {
                        endFrame = Math.round((this._endTimestamp - sample.timestamp) * sample.sampleRate);
                    }
                    if (startFrame > 0 || endFrame < sample.numberOfFrames) {
                        // Trim the sample if it sticks out of the trim region on either end
                        const trimmedSample = sample.trim(startFrame, endFrame);
                        sample.close();
                        sample = trimmedSample;
                        if (sample.numberOfFrames === 0) {
                            sample.close();
                            continue;
                        }
                    }
                    // Offset the timestamp as needed
                    sample.setTimestamp(sample.timestamp - this._startTimestamp);
                    await this._registerAudioSample(sample, source, outputTrackId, () => lastSampleTimestamp);
                }
                source.close();
                this._synchronizer.closeTrack(outputTrackId);
            })());
        }
        let ownGroup = null;
        if (!trackOptions.group) {
            ownGroup = new output/* OutputTrackGroup */.Q6();
        }
        const audioTrackLanguageCode = await track.getLanguageCode();
        this.output.addAudioTrack(audioSource, {
            // TODO: This condition can be removed when all demuxers properly homogenize to BCP47 in v2
            languageCode: (0,misc/* isIso639Dash2LanguageCode */.Nu)(audioTrackLanguageCode) ? audioTrackLanguageCode : undefined,
            name: await track.getName() ?? undefined,
            disposition: await track.getDisposition(),
            group: ownGroup ?? trackOptions.group,
        });
        this._addedCounts.audio++;
        this._totalTrackCount++;
        this.utilizedTracks.push(track);
        this._outputTrackIds.push(outputTrackId);
        this._outputOwnTrackGroups.push(ownGroup);
    }
    /** @internal */
    async _registerAudioSample(sample, source, outputTrackId, getLastSampleTimestamp) {
        this._reportProgress(outputTrackId, sample.timestamp + sample.duration);
        await source.add(sample);
        sample.close();
        const lastSampleTimestamp = getLastSampleTimestamp();
        if (lastSampleTimestamp !== null) {
            if (this._synchronizer.shouldWait(outputTrackId, lastSampleTimestamp)) {
                await this._synchronizer.wait(lastSampleTimestamp);
            }
        }
    }
    /** @internal */
    _reportProgress(trackId, endTimestamp) {
        if (!this._computeProgress) {
            return;
        }
        (0,misc/* assert */.vA)(this._totalDuration !== null);
        this._maxTimestamps.set(trackId, Math.max(endTimestamp, this._maxTimestamps.get(trackId)));
        const minTimestamp = Math.min(...this._maxTimestamps.values());
        const newProgress = (0,misc/* clamp */.qE)(minTimestamp / this._totalDuration, 0, 1);
        if (newProgress !== this._lastProgress) {
            this._lastProgress = newProgress;
            this.onProgress?.(newProgress, minTimestamp);
        }
    }
}
/**
 * Thrown when a conversion couldn't complete due to being canceled.
 * @group Conversion
 * @public
 */
class ConversionCanceledError extends Error {
    /** Creates a new {@link ConversionCanceledError}. */
    constructor(message = 'Conversion has been canceled.') {
        super(message);
        this.name = 'ConversionCanceledError';
    }
}
const MAX_TIMESTAMP_GAP = 1; // in seconds
/**
 * Utility class for synchronizing multiple track packet consumers with one another. We don't want one consumer to get
 * too out-of-sync with the others, as that may lead to a large number of packets that need to be internally buffered
 * before they can be written. Therefore, we use this class to slow down a consumer if it is too far ahead of the
 * slowest consumer.
 */
class TrackSynchronizer {
    constructor() {
        this.maxTimestamps = new Map(); // Track ID -> timestamp
        this.resolvers = [];
    }
    declareTrack(trackId) {
        this.maxTimestamps.set(trackId, 0);
    }
    shouldWait(trackId, timestamp) {
        const currentValue = this.maxTimestamps.get(trackId);
        (0,misc/* assert */.vA)(currentValue !== undefined);
        this.maxTimestamps.set(trackId, Math.max(timestamp, currentValue));
        const newMin = this.computeMinAndMaybeResolve();
        return timestamp - newMin > MAX_TIMESTAMP_GAP; // Should wait if it is too far ahead of the slowest consumer
    }
    wait(timestamp) {
        const { promise, resolve } = (0,misc/* promiseWithResolvers */.nJ)();
        this.resolvers.push({
            timestamp,
            resolve,
        });
        return promise;
    }
    closeTrack(trackId) {
        this.maxTimestamps.delete(trackId);
        this.computeMinAndMaybeResolve();
    }
    computeMinAndMaybeResolve() {
        let newMin = Infinity;
        for (const [, timestamp] of this.maxTimestamps) {
            newMin = Math.min(newMin, timestamp);
        }
        for (let i = 0; i < this.resolvers.length; i++) {
            const entry = this.resolvers[i];
            if (entry.timestamp - newMin < MAX_TIMESTAMP_GAP) {
                // The gap has gotten small enough again, the consumer can continue again
                entry.resolve();
                this.resolvers.splice(i, 1);
                i--;
            }
        }
        return newMin;
    }
}

;// ./node_modules/mediabunny/dist/modules/src/index.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
/// <reference types="dom-mediacapture-transform" preserve="true" />
/// <reference types="dom-webcodecs" preserve="true" />

const MEDIABUNNY_LOADED_SYMBOL = Symbol.for('mediabunny loaded');
if (globalThis[MEDIABUNNY_LOADED_SYMBOL]) {
    logging/* Logging */.y._error('[WARNING]\nMediabunny was loaded twice.'
        + ' This will likely cause Mediabunny not to work correctly.'
        + ' Check if multiple dependencies are importing different versions of Mediabunny,'
        + ' or if something is being bundled incorrectly.');
}
globalThis[MEDIABUNNY_LOADED_SYMBOL] = true;




















// 🐡🦔


/***/ }

}]);
//# sourceMappingURL=179.bundle.js.map