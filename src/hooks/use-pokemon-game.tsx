import { $, useComputed$, useContext } from "@builder.io/qwik";
import { PokemonGameContext } from "~/context";

export const usePokemonGame = () => {
    const pokemonGame = useContext(PokemonGameContext);
    
    const changePokemonId = $((value: number) => {
        if (pokemonGame.pokemonId + value <= 0) return;
        pokemonGame.pokemonId += value;
    });

    const toggleFromBack = $(() => {
        pokemonGame.showBack = !pokemonGame.showBack;
    });

    return {
        pokemonId: useComputed$(() => pokemonGame.pokemonId),
        showBack: useComputed$(() => pokemonGame.showBack),

        nextPokemon: $(() => changePokemonId(+1)),
        previousPokemon: $(() => changePokemonId(-1)),
        toggleFromBack: toggleFromBack,
    };
}