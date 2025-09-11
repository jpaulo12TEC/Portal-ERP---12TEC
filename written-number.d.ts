declare module "written-number" {
  interface WrittenNumberOptions {
    lang?: string;
  }
  function writtenNumber(n: number, options?: WrittenNumberOptions): string;
  namespace writtenNumber {
    var defaults: { lang: string };
  }
  export = writtenNumber;
}
