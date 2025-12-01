import { $, component$ } from "@builder.io/qwik";
import { useNavigate, type DocumentHead } from "@builder.io/qwik-city";
import { PokemonImage } from "~/components/shared/pokemons/pokemonImage";
import { usePokemonGame } from "~/hooks/use-pokemon-game";

export default component$(() => {
  const nav = useNavigate();

  const goToPokemon = $((id: number) => {
    nav(`/pokemon/${id}/`);
  });

  const { pokemonId, showBack, nextPokemon, previousPokemon, toggleFromBack } = usePokemonGame();

  return (
    <>
      <span class="text-lg font-bold">Buscador simple</span>
      <span class="text-5xl">{pokemonId.value}</span>
      <div onClick$={() => goToPokemon(pokemonId.value)} style="cursor: pointer;">
        <PokemonImage
          pokemonId={pokemonId.value}
          isBack={showBack.value}
          size={200}
        />
      </div>

      <div class="mt-2 space-x-3">
        <button
          onClick$={previousPokemon}
          disabled={pokemonId.value <= 1}
          class="btn btn-primary"
        >
          Anterior
        </button>
        <button onClick$={nextPokemon} class="btn btn-primary">
          Siguiente
        </button>
        <button
          onClick$={toggleFromBack}
          class="btn btn-primary"
        >
          Voltear
        </button>
      </div>
    </>
  );
});

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
