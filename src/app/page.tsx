export default function Page() {
  return (
    <div className="flex flex-col gap-2 items-center justify-center h-screen bg-gray-300">
      <h1 className="text-3xl bold">Welcome to web3 game BlackJack</h1>
      <h2 className="text-2xl bold">Message: Player wins/ dealer Wins: BlackJack / bust!</h2>
      <div className="mt-4">
        <h2>Dealer`s hand</h2>
        <div className="flex flex-row gap-2">
          <div className="w-32 h-42 border-1 border-black bg-white rounded-md">Card 1</div>
          <div className="w-32 h-42 border-1 border-black bg-white rounded-md">Card 2</div>
          <div className="w-32 h-42 border-1 border-black bg-white rounded-md">Card 3</div>
        </div>
        </div>

        <div>
          <h2>Player`s hand</h2>
          <div className="flex flex-row gap-2">
            <div className="w-32 h-42 border-1 border-black bg-white rounded-md">Card 1</div>
            <div className="w-32 h-42 border-1 border-black bg-white rounded-md">Card 2</div>
            <div className="w-32 h-42 border-1 border-black bg-white rounded-md">Card 3</div>
          </div>
        </div>

        <div className="flex flex-row gap-2 mt-4">
          <button className="bg-amber-300 p-2 rounded-md">Hit</button>
          <button className="bg-amber-300 p-2 rounded-md">Stand</button>
          <button className="bg-amber-300 p-2 rounded-md">Reset</button>
        </div>
    </div>
  );
}