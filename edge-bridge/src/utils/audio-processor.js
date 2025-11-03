export class AudioProcessor {
  static opusToPCM(opusBuffer) {
    return opusBuffer;
  }

  static pcmToInt16Array(buffer) {
    const int16Array = new Int16Array(buffer.length / 2);
    for (let i = 0; i < int16Array.length; i++) {
      int16Array[i] = buffer.readInt16LE(i * 2);
    }
    return int16Array;
  }

  static int16ArrayToBuffer(int16Array) {
    const buffer = Buffer.allocUnsafe(int16Array.length * 2);
    for (let i = 0; i < int16Array.length; i++) {
      buffer.writeInt16LE(int16Array[i], i * 2);
    }
    return buffer;
  }

  static resampleTo24kHz(buffer, originalSampleRate) {
    if (originalSampleRate === 24000) {
      return buffer;
    }

    const ratio = 24000 / originalSampleRate;
    const inputLength = buffer.length / 2;
    const outputLength = Math.floor(inputLength * ratio);
    const output = Buffer.allocUnsafe(outputLength * 2);

    for (let i = 0; i < outputLength; i++) {
      const srcIndex = Math.floor(i / ratio);
      const sample = buffer.readInt16LE(srcIndex * 2);
      output.writeInt16LE(sample, i * 2);
    }

    return output;
  }

  static detectSpeech(pcmBuffer, threshold = 500) {
    const samples = this.pcmToInt16Array(pcmBuffer);
    let sum = 0;

    for (let i = 0; i < samples.length; i++) {
      sum += Math.abs(samples[i]);
    }

    const average = sum / samples.length;
    return average > threshold;
  }

  static chunkAudio(buffer, chunkSizeMs = 20, sampleRate = 24000) {
    const bytesPerSample = 2;
    const samplesPerChunk = (sampleRate * chunkSizeMs) / 1000;
    const bytesPerChunk = samplesPerChunk * bytesPerSample;
    const chunks = [];

    for (let i = 0; i < buffer.length; i += bytesPerChunk) {
      const chunk = buffer.slice(i, i + bytesPerChunk);
      if (chunk.length === bytesPerChunk) {
        chunks.push(chunk);
      }
    }

    return chunks;
  }
}
