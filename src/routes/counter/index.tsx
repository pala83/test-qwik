import { component$ } from "@builder.io/qwik";
import { Button } from "~/components/ui";
import { useCounter } from "~/hooks/use-counter";

export default component$(() => {
  const { counter, increment, decrement } = useCounter(5);
  return (
    <>
      <span class="text-2xl">Counter</span>
      <span class="text-7xl">{counter.value}</span>
      <div class="mt-2 space-x-3">
        <Button onClick$={decrement} class="btn btn-primary">
          decrement
        </Button>
        <Button onClick$={increment} class="btn btn-primary">
          increment
        </Button>
      </div>
    </>
  );
});
