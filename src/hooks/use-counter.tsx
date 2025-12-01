import { $, useComputed$, useSignal } from "@builder.io/qwik";

export const useCounter = (initialValue: number) => {
    const counter = useSignal<number>(initialValue);

    const increment = $(() => {
        counter.value++;
    });
    
    const decrement = $(() => {
        counter.value--;
    });


    return {
        counter: useComputed$(() => counter.value), // señal de solo lectura
        increment,
        decrement
    };
}