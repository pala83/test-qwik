# Documentacion

Esto es porque todavia estoy aprendiendo a usarlo 🫠.

> Resumen rapido: es una especie de React con signals y SSR

## Mantener estado

`useSignal<tipo de dato primitivo>(instanca inicial)`

- `useSignal();`: mantiene una signal del estado de un dato `promitivo`
- `useStore();`: lo mismo que el `useSignal();` pero para `objetos` o datos complejos

### Serializacion de funciones en componentes

`const foo = $((value: type, ...)=> {})`

- Es necesario serializar las funciones para aprobechar el poder de `resumability`
- Al intentar llamar a una funcion mediante un evento se solicitara `serializar` la funcion para poder cargar eljavascript bajo demanda.

### Comunicacion entre componentes

Altamente recomendado definir una interfaz con la estructura de las props recibidas, aprobecha el `Typescript`

```ts
interface Props {
    value: type;
    ...
}
```

```ts
export const Component = component$((props: Props) => {
    ...
    return <p atr={props.value}></p>
});
```
