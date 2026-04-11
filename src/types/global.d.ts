/* eslint-disable node/prefer-global/buffer */
declare module "fontmin" {
  namespace FontMin {
    interface GlyphOptions {
      text?: string;
      hinting?: boolean;
      basic?: boolean;
      lowercase?: boolean;
      useDefaultFeatures?: boolean;
    }

    interface File {
      path: string;
      contents: Buffer;
    }

    interface FontMin {
      src: (globs: string | string[]) => FontMin;
      dest: (path: string) => FontMin;
      use: (plugin: any) => FontMin;
      run: (callback: (err: Error | null, files?: File[]) => void) => void;

      glyph: (options?: GlyphOptions) => any;
      ttf2woff: () => any;
      ttf2woff2: () => any;
    }

    function glyph(options?: GlyphOptions): any;
    function ttf2woff(): any;
    function ttf2woff2(): any;
  }

  function FontMin(): FontMin.FontMin;
  export = FontMin;
}
