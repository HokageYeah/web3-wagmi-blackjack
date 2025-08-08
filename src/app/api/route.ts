// API实现，前后端不分离项目
import { nocoDBClient } from '@/app/api/lib/nocodb';

// when the game is inited, get player and dealer 2 random cards respectively
export interface Card {
    rank: string,
    suit: string
}

const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const suits = ["❤️", "♦️", "♣️", "♠️"];
const initialDeck = ranks.flatMap(rank => suits.map(suit => ({ rank, suit })));
const gameState: {
    playerHand: Card[],
    dealerHand: Card[],
    deck: Card[],
    message: string,
    score: number
} = {
    playerHand: [],
    dealerHand: [],
    deck: initialDeck,
    message: "",
    score: 0
}
// 获取几张随机的卡牌函数
function getRandomCard(deck: Card[], count: number) {
    const randomIndexSet = new Set<number>();
    while (randomIndexSet.size < count) {
        const randomIndex = Math.floor(Math.random() * deck.length);
        randomIndexSet.add(randomIndex);
    }
    const randomCards = deck.filter((_, index) => randomIndexSet.has(index));
    const remainingDeck = deck.filter((_, index) => !randomIndexSet.has(index));
    return [randomCards, remainingDeck]
}
export async function GET() {
    // reset the game
    gameState.playerHand = [];
    gameState.dealerHand = [];
    gameState.deck = initialDeck;
    gameState.message = "";

    // 从 NocoDB 加载最新分数
    try {
        gameState.score = await nocoDBClient.getLatestScore();
    } catch (error) {
        console.error('加载分数失败:', error);
        gameState.score = 0;
    }

    const [playerHand, remainingDeck1] = getRandomCard(gameState.deck, 2);
    const [dealerHand, remainingDeck2] = getRandomCard(remainingDeck1, 2);
    gameState.playerHand = playerHand;
    gameState.dealerHand = dealerHand;
    gameState.deck = remainingDeck2;
    gameState.message = "";

    return new Response(JSON.stringify(
        {
            playerHand: gameState.playerHand,
            dealerHand: [gameState.dealerHand[0], { rank: "?", suit: "?" } as Card],
            message: gameState.message,
            score: gameState.score
        }
    ),
        {
            status: 200,
        });
}

// when hit is clicked, get a random card from the deck and add it to the player hand 
export async function POST(request: Request) {
    const { action } = await request.json()
    if (action === "hit") {
        const [cards, newDeck] = getRandomCard(gameState.deck, 1)
        gameState.playerHand.push(...cards);
        gameState.deck = newDeck;

        let playerHandValue = calculateHandValue(gameState.playerHand);
        if (playerHandValue > 21) {
            gameState.message = "Bust! Player loses!";
            gameState.score -= 100;
            // 保存分数到 NocoDB
            try {
                await nocoDBClient.saveScore(gameState.score);
            } catch (error) {
                console.error('保存分数失败:', error);
            }
        } else if (playerHandValue === 21) {
            gameState.message = "Player wins!";
            gameState.score += 100;
            // 保存分数到 NocoDB
            try {
                await nocoDBClient.saveScore(gameState.score);
            } catch (error) {
                console.error('保存分数失败:', error);
            }
        }

    } else if (action === "stand") {
        while (calculateHandValue(gameState.dealerHand) < 17) {
            const [randomCards, newDeck] = getRandomCard(gameState.deck, 1)
            gameState.dealerHand.push(...randomCards);
            gameState.deck = newDeck;
        }
        // dealerHand手牌区
        const dealerHandValue = calculateHandValue(gameState.dealerHand);
        if (dealerHandValue > 21) {
            gameState.message = "Dealer busts! Player wins!";
            gameState.score += 100;
        } else if (dealerHandValue === 21) {
            gameState.message = "Dealer black jack! Player loses!";
            gameState.score -= 100;
        } else {
            const playerHandValue = calculateHandValue(gameState.playerHand);
            if (playerHandValue > dealerHandValue) {
                gameState.message = "Player wins!";
                gameState.score += 100;
            } else if (playerHandValue < dealerHandValue) {
                gameState.message = "Dealer wins!";
                gameState.score -= 100;
            } else {
                gameState.message = "Draw!";
            }
        }

        // 保存分数到 NocoDB
        try {
            await nocoDBClient.saveScore(gameState.score);
        } catch (error) {
            console.error('保存分数失败:', error);
        }
    } else if (action === "reset") {

    } else {
        return new Response(JSON.stringify({ message: "Invalid action" }), { status: 400 });
    }
    return new Response(JSON.stringify(
        {
            playerHand: gameState.playerHand,
            dealerHand: gameState.message === "" ?
                [gameState.dealerHand[0], { rank: "?", suit: "?" } as Card] : gameState.dealerHand,
            message: gameState.message,
            score: gameState.score
        }
    ),
        {
            status: 200,
        });
}

// calculateHandValue 中文解释： 排的数组最接近21 但是又不超过21的值
function calculateHandValue(hand: Card[]) {
    let value = 0;
    let hasAce = false;
    for (const card of hand) {
        if (card.rank === "A") {
            hasAce = true;
        }
        if (["J", "Q", "K"].includes(card.rank)) {
            value += 10;
        } else if (card.rank === "A") {
            value += 1;
        } else {
            value += parseInt(card.rank);
        }
    }
    if (hasAce && value + 10 <= 21) {
        value += 10;
    }
    return value;
}
//  