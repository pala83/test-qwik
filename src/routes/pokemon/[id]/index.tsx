import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { PokemonImage } from "~/components/shared/pokemons/pokemonImage";
import { usePokemonGame } from "~/hooks/use-pokemon-game";

export const usePokemonId = routeLoader$<number>(({ params, redirect }) => {
  const id = Number(params.id);
  if (isNaN(id) || id <= 0 || id > 1025) {
    redirect(301, "/pokemons/list-ssr/");
  }
  return id;
});

export default component$(() => {
  const location = usePokemonId();
  const { showBack, toggleFromBack } = usePokemonGame();

  return (
    <>
      <span class="text-lg font-bold">Pokemon ID {location}</span>
      <PokemonImage
        pokemonId={location.value}
        isBack={showBack.value}
        size={200}
      />
      <div>
        <button onClick$={toggleFromBack} class="btn btn-primary">voltear</button>
      </div>
    </>
  );
});
