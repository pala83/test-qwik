import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { PokemonImage } from '~/components/shared/pokemons/pokemonImage';

export const usePokemonId = routeLoader$<number>(({params, redirect}) => {
    const id = Number(params.id);
    if (isNaN(id) || id <= 0 || id > 1025) {
        redirect(301, '/pokemons/list-ssr/');
    }
    return id;
});

export default component$(() => {
    const location = usePokemonId();

    return (
        <>
          <span class="text-lg font-bold">Pokemon ID {location}</span>
          <PokemonImage pokemonId={location.value} size={200} />
        </>
    );
});