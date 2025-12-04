import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { LuMonitor, LuMoon, LuSun } from "@qwikest/icons/lucide";
import { Dropdown } from "~/components/ui/dropdown/dropdown";

const THEME_SELECTED = "theme-option";

enum ThemeOption {
  SYSTEM = "system",
  DARK = "dark",
  LIGHT = "light",
}

const applyTheme = (theme: ThemeOption) => {
  const root = document.documentElement;
  root.classList.remove("light", "dark");

  if (theme === ThemeOption.SYSTEM) {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
};

export const ToggleTheme = component$(() => {
  const themeSelected = useSignal<ThemeOption>(ThemeOption.SYSTEM);

  const setTheme = $((theme: ThemeOption) => {
    themeSelected.value = theme;
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const savedTheme = localStorage.getItem(
      THEME_SELECTED,
    ) as ThemeOption | null;
    if (savedTheme) {
      themeSelected.value = savedTheme;
    }
    applyTheme(themeSelected.value);
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => themeSelected.value);
    localStorage.setItem(THEME_SELECTED, themeSelected.value);
    applyTheme(themeSelected.value);
  });

  return (
    <Dropdown.Root>
      <Dropdown.Trigger look={"ghost"}>
        {themeSelected.value === ThemeOption.DARK && <LuMoon />}
        {themeSelected.value === ThemeOption.LIGHT && <LuSun />}
        {themeSelected.value === ThemeOption.SYSTEM && <LuMonitor />}
      </Dropdown.Trigger>
      <Dropdown.Popover gutter={8}>
        <Dropdown.Group>
          <Dropdown.Item
            key="System"
            onClick$={() => setTheme(ThemeOption.SYSTEM)}
          >
            <LuMonitor />
            System
          </Dropdown.Item>
          <Dropdown.Item key="Dark" onClick$={() => setTheme(ThemeOption.DARK)}>
            <LuMoon />
            Dark
          </Dropdown.Item>
          <Dropdown.Item
            key="Light"
            onClick$={() => setTheme(ThemeOption.LIGHT)}
          >
            <LuSun />
            Light
          </Dropdown.Item>
        </Dropdown.Group>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
});
