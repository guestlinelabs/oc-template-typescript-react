const createExcludeRegex = require("../lib/to-abstract-base-template-utils/oc-webpack/lib/configurator/createExcludeRegex");

test("should create a regex that match against any node module set aside given ones", () => {
  const regex = createExcludeRegex([
    "oc-template-typescript-react-compiler/utils",
    "underscore"
  ]);
  expect(regex).toBeInstanceOf(RegExp);

  expect(regex.test("node_modules/lodash")).toBe(true);
  expect(regex.test("node_modules/oc-template-typescript-react-compiler")).toBe(true);

  expect(regex.test("node_modules/oc-template-typescript-react-compiler/utils")).toBe(
    false
  );
  expect(regex.test("node_modules/underscore")).toBe(false);
});
