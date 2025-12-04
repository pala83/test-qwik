import { $, component$, useSignal } from "@builder.io/qwik";
import { QwikLogo } from "../../icons/qwik";
import { Link } from "@builder.io/qwik-city";
import { Avatar, Button, buttonVariants, Modal } from "~/components/ui";
import { useSession, useSignIn, useSignOut } from "~/routes/plugin@auth";

import { ToggleTheme } from "../toggleTheme/toggleTheme";
import { LuUser, LuLogOut } from "@qwikest/icons/lucide";

export default component$(() => {
  const session = useSession();
  const signIn = useSignIn();
  const signOut = useSignOut();
  const show = useSignal(false);

  const handleSignOut = $(() => {
    signOut.submit({ redirectTo: "/" });
    show.value = false;
  });

  return (
    <header class="flex items-center justify-between p-5">
      <Link href="/" title="qwik">
        <QwikLogo height={50} width={100} />
      </Link>
      <ul class="flex list-none items-center gap-3 px-5">
        <li>
          <ToggleTheme />
        </li>
        <li>
          <Link href="/agenda">
            <Button>Mi agenda</Button>
          </Link>
        </li>
        <li>
          {session.value?.user ? (
            <Modal.Root bind:show={show}>
              <Modal.Trigger
                class={[
                  buttonVariants({ look: "ghost" }),
                  "relative h-12 w-12 px-0",
                ]}
              >
                <Avatar.Root class="overflow-hidden rounded-full shadow-sm">
                  <Avatar.Image
                    src={session.value.user.image || ""}
                    alt={session.value.user.name || "Avatar"}
                    class="h-full w-full object-cover"
                  />
                  <Avatar.Fallback>
                    {session.value.user.name?.charAt(0).toUpperCase() || "U"}
                  </Avatar.Fallback>
                </Avatar.Root>
                <span class="bg-alert pointer-events-none absolute right-0 bottom-0 flex h-2/5 w-2/5 items-center justify-center rounded-full opacity-0 transition-opacity duration-200 ease-in-out group-hover:pointer-events-auto group-hover:opacity-80">
                  <LuLogOut class="text-primary-foreground" />
                </span>
              </Modal.Trigger>
              <Modal.Panel>
                <Modal.Title>Cerrar sesión</Modal.Title>
                <Modal.Description>
                  ¿Estás seguro de que deseas cerrar sesión?
                </Modal.Description>

                <footer class="mt-4 flex justify-end gap-2">
                  <Button
                    look={"outline"}
                    onClick$={() => (show.value = false)}
                  >
                    No
                  </Button>
                  <Button look={"alert"} onClick$={() => handleSignOut()}>
                    Sí
                  </Button>
                </footer>
              </Modal.Panel>
            </Modal.Root>
          ) : (
            <Button
              class="p-auto rounded-full"
              onClick$={() => signIn.submit({ providerId: "google" })}
            >
              <LuUser class="aspect-square" />
            </Button>
          )}
        </li>
      </ul>
    </header>
  );
});
