import { TTSDriver } from '@podmine/types';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export class MacSayDriver implements TTSDriver {
  private voice: string;

  constructor(voice = 'Samantha') {
    this.voice = voice;
  }

  async synthesize(text: string): Promise<Buffer> {
    const tempFile = path.join(os.tmpdir(), `podmine-say-${Date.now()}.m4a`);
    const tempTextFile = path.join(os.tmpdir(), `podmine-say-text-${Date.now()}.txt`);

    try {
      // Write prompt text to file to avoid command injection or length issues in CLI shell execution
      await fs.promises.writeFile(tempTextFile, text, 'utf8');

      // Run macOS built-in say command, saving audio as high-quality m4a (AAC)
      await execAsync(`say -v "${this.voice}" -f "${tempTextFile}" -o "${tempFile}"`);

      // Read output file back as raw audio Buffer
      const buffer = await fs.promises.readFile(tempFile);
      return buffer;
    } catch (error: any) {
      throw new Error(`macOS say command failed: ${error.message}`);
    } finally {
      // Clean up temp files asynchronously
      await fs.promises.unlink(tempTextFile).catch(() => {});
      await fs.promises.unlink(tempFile).catch(() => {});
    }
  }
}
