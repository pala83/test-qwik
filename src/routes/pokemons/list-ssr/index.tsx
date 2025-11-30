import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

export default component$(() => {
    return (
        <div>Hola mundo - SSR</div>
    );
});

export const head: DocumentHead = {
  title: "SSR - Listado de Pokemons",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};