import {
  component$,
  useComputed$,
  useSignal,
  useTask$,
} from "@builder.io/qwik";

interface PokemonImageProps {
  pokemonId: number;
  size?: number;
  isBack?: boolean;
}

export const PokemonImage = component$(
  ({ pokemonId, size = 200, isBack = false }: PokemonImageProps) => {
    const imageLoaded = useSignal(false);
    useTask$(({ track }) => {
      track(() => pokemonId);
      imageLoaded.value = false;
    });

    const imageUrl = useComputed$<string>(() => {
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${isBack ? "back/" : ""}${pokemonId}.png`;
    });

    return (
      <div
        class="flex items-center justify-center"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {!imageLoaded.value && <span>Cargando...</span>}
        <img
          src={imageUrl.value}
          class={{ hidden: !imageLoaded.value }}
          alt="Pokemons sprite"
          width={size}
          height={size}
          onLoad$={() => (imageLoaded.value = true)}
        />
      </div>
    );
  },
);
