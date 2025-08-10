"use client"; // 添加这行表示这是一个客户端组件
// app 目录下的组件都是服务端组件（Server Components），而`useEffect`和`useState`是客户端组件（Client Components）才可用的钩子。
import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSignMessage } from "wagmi";

export default function Page() {
  // 设置
  const [message, setMessage] = useState<string>("");
  const [playerHand, setPlayerHand] = useState<{rank: string, suit: string}[]>([]);
  const [dealerHand, setDealerHand] = useState<{rank: string, suit: string}[]>([]);
  const [score, setScore] = useState<number>(0);
  const { address, isConnected } = useAccount();
  const [isSigned, setIsSigned] = useState<boolean>(false);
  const { signMessageAsync } = useSignMessage();
  // 初始化游戏
  useEffect(() => {
    const initGame = async() => {
      const response = await fetch("/api", {method: "GET"});
      const data = await response.json();
      console.log('data', data);
      setPlayerHand(data.playerHand);
      setDealerHand(data.dealerHand);
      setMessage(data.message);
      setScore(data.score);
    };
    initGame();
  }, []);
  
  async function hit() {
    const response = await fetch("/api", {method: "POST", body: JSON.stringify({action: "hit"})});
    const data = await response.json();
    setPlayerHand(data.playerHand);
    setDealerHand(data.dealerHand);
    setMessage(data.message);
    setScore(data.score);
  }
  async function stand() {
    const response = await fetch("/api", {method: "POST", body: JSON.stringify({action: "stand"})});
    const data = await response.json();
    setPlayerHand(data.playerHand);
    setDealerHand(data.dealerHand);
    setMessage(data.message);
    setScore(data.score);
  }
  async function reset() {
    const response = await fetch("/api", {method: "GET"});
    const data = await response.json();
    setPlayerHand(data.playerHand);
    setDealerHand(data.dealerHand);
    setMessage(data.message);
    setScore(data.score);
  }
  
  async function handleSign() {
    const message = `welcome to web3 game BlackJack at ${new Date().toLocaleString()}`;
    const signature = await signMessageAsync({message: message});
    const response = await fetch("/api", {method: "POST", body: JSON.stringify({
      action: "auth",
      address: address,
      message: message,
      signature: signature
    })});
    if(response.status === 200) {
      setIsSigned(true);
    } else {
      alert("Signature verification failed");
      setIsSigned(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 items-center justify-center h-screen bg-gray-300">
      <ConnectButton />
      <button className="border-black bg-amber-300 p-2 rounded-md">sign with your wallet</button>
      <h1 className="text-3xl bold">Welcome to web3 game BlackJack</h1>
      <h2 className={`text-2xl bold ${message.includes('win') ? "bg-green-300" : "bg-amber-300"}`}>Score: {score} {message}</h2>
      <div className="mt-4">
        <h2>Dealer`s hand</h2>
        <div className="flex flex-row gap-2">
          {
            dealerHand.map((card, index) => (
              <div key={index} className="w-32 h-42 border-1 border-black bg-white rounded-md flex flex-col justify-between">
                <p className="self-start p-2 text-2xl">{card.rank}</p>
                <p className="self-center p-2 text-3xl">{card.suit}</p>
                <p className="self-end p-2 text-2xl">{card.rank}</p>
              </div>
            ))
          }
        </div>
        </div>

        <div>
          <h2>Player`s hand</h2>
          <div className="flex flex-row gap-2">
            {
              playerHand.map((card, index) => (
                <div key={index} className="w-32 h-42 border-1 border-black bg-white rounded-md flex flex-col justify-between">
                  <p className="self-start p-2 text-2xl">{card.rank}</p>
                  <p className="self-center p-2 text-3xl">{card.suit}</p>
                  <p className="self-end p-2 text-2xl">{card.rank}</p>
                </div>
              ))
            }
          </div>
        </div>

        <div className="flex flex-row gap-2 mt-4">
          {
            message === "" ?
            <>
                      <button onClick={hit} className="bg-amber-300 p-2 rounded-md">Hit</button>
                      <button onClick={stand} className="bg-amber-300 p-2 rounded-md">Stand</button>
            </>:
                      <button onClick={reset} className="bg-amber-300 p-2 rounded-md">Reset</button>
          }
        </div>
    </div>
  );
}