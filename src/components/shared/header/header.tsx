import { component$ } from "@builder.io/qwik";
import { QwikLogo } from "../../icons/qwik";
import { Link } from "@builder.io/qwik-city";
import { Button } from "~/components/ui";

import { ToggleTheme } from "../toggleTheme/toggleTheme";

export default component$(() => {
  return (
    <header class="">
      <div class="flex justify-between align-middle">
        <div class="inline-block">
          <Link href="/" title="qwik">
            <QwikLogo height={50} width={143} />
          </Link>
        </div>
        <ul class="flex list-none gap-3 px-5">
          <li>
            <ToggleTheme />
          </li>
          <li>
            <Link href="/counter">
              <Button>CounterHook</Button>
            </Link>
          </li>

          <li>
            <Link href="/pokemons/list-ssr/">
              <Button>SSR</Button>
            </Link>
          </li>

          <li>
            <Link href="/pokemons/list-client/">
              <Button>Client</Button>
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
});
