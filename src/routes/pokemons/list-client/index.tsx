import {
  $,
  component$,
  useContext,
  useOnDocument,
  useTask$,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { PokemonImage } from "~/components/shared/pokemons/pokemonImage";
import { PokemonListContext } from "~/context";
import { getSmallPokemons } from "~/helpers/get-pokemons";

export default component$(() => {
  const pokemonContext = useContext(PokemonListContext);

  useTask$(async ({ track }) => {
    track(() => pokemonContext.currentPage);
    const pokemons = await getSmallPokemons(
      pokemonContext.currentPage * 30,
      30,
    );
    pokemonContext.pokemons = [...pokemonContext.pokemons, ...pokemons];
    pokemonContext.isLoading = false;
  });

  useOnDocument(
    "scroll",
    $(() => {
      const maxScroll = document.body.scrollHeight;
      const currentScroll = window.scrollY + window.innerHeight;
      if (currentScroll + 200 >= maxScroll && !pokemonContext.isLoading) {
        pokemonContext.isLoading = true;
        pokemonContext.currentPage++;
      }
    }),
  );

  const changePokemonId = $((value: number) => {
    if (pokemonContext.currentPage + value < 0) return;
    pokemonContext.currentPage += value;
  });

  return (
    <>
      <div class="flex flex-col">
        <span class="my-5 text-5xl">Status</span>
        <span>Página actual: {pokemonContext.currentPage}</span>
        <span>Está cargando página: </span>
      </div>
      <div class="mt-10">
        <button
          onClick$={() => changePokemonId(1)}
          class="btn btn-primary mr-2"
        >
          Siguientes
        </button>
      </div>

      <div class="mt-5 grid sm:grid-cols-2 md:grid-cols-5 xl:grid-cols-7">
        {pokemonContext.pokemons.map(({ name, id }) => (
          <div key={name} class="m-5 flex flex-col items-center justify-center">
            <PokemonImage pokemonId={id} size={100} />
            <span class="capitalize">{name}</span>
          </div>
        ))}
      </div>
    </>
  );
});

export const head: DocumentHead = {
  title: "Client - Listado de Pokemons",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
