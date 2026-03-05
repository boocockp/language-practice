declare module "handlebars-async-helpers" {
  import type Handlebars from "handlebars";

  type AsyncHandlebars = Omit<typeof Handlebars, "compile"> & {
    compile: (template: string) => (context: unknown) => Promise<string>;
  };

  function asyncHelpers(hbs: typeof Handlebars): AsyncHandlebars;
  export = asyncHelpers;
}
