import { $, component$, useSignal } from "@builder.io/qwik";
import { useNavigate, type DocumentHead } from "@builder.io/qwik-city";
import { PokemonImage } from "~/components/shared/pokemons/pokemonImage";

export default component$(() => {

  const pokemonId = useSignal<number>(1); // para datos primitivos booleanos, strings, numbers
  const showBack = useSignal<boolean>(false); // useStore() para datos complejos

  const changePokemonId = $((value: number) => {
    if((pokemonId.value + value) <= 0)
      return;
    pokemonId.value += value;
  });

  const nav = useNavigate();
  const goToPokemon = $(() => {
    nav(`/pokemon/${pokemonId.value}/`);
  })

  return (
    <>
      <span class="text-lg font-bold">Buscador simple</span>
      <span class="text-5xl" >{pokemonId}</span>
      <div onClick$={goToPokemon} style="cursor: pointer;">
        <PokemonImage pokemonId={pokemonId.value} isBack={showBack.value} size={200} />
      </div>

      <div class="mt-2 space-x-3">
        <button onClick$={() => changePokemonId(-1)} disabled={pokemonId.value <= 1} class="btn btn-primary">Anterior</button>
        <button onClick$={() => changePokemonId(1)} class="btn btn-primary">Siguiente</button>
        <button onClick$={() => showBack.value = !showBack.value} class="btn btn-primary">Voltear</button>
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
