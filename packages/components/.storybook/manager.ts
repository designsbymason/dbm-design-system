import { addons } from "storybook/manager-api";
import { dbmStorybookTheme } from "./theme";

addons.setConfig({
  theme: dbmStorybookTheme,
});
