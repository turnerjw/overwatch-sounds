import { AudioPlayHandle } from "audio-play";
import * as path from "path";
const _basePath: string = path.join(__dirname,"..", "sounds");

export const audioPaths = {
  elimination: path.join(_basePath, "elimination.wav"),
  headshot: path.join(_basePath, "headshot.wav"),
  hitmarker: path.join(_basePath, "hitmarker.wav"),
};

export type OverwatchAudioBuffers = {
    [key in keyof typeof audioPaths]: AudioBuffer;
};

export type OverwatchPlayFunctions = {
    [key in keyof typeof audioPaths]: AudioPlayHandle;
};