import { createContextId } from "@builder.io/qwik";

export interface PokemonGameState {
  pokemonId: number;
  showBack: boolean;
}

export const PokemonGameContext = createContextId<PokemonGameState>(
  "pokemon.game-context",
);
