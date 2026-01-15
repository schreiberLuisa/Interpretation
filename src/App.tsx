import { useState, useEffect, useRef } from 'react';
import './App.css';

interface Niemand {
    id: number;
    x: number;
    y: number;
    suitColor: string;
    speed: number;
}

// SVG für den Spieler (kein Niemand)
const PlayerSVG = () => (
    <svg width="40" height="60" viewBox="0 0 40 60">
        <circle cx="20" cy="15" r="10" fill="#FFD700" stroke="#B8860B" strokeWidth="2"/>
        <line x1="20" y1="25" x2="20" y2="40" stroke="#2c3e50" strokeWidth="3"/>
        <line x1="10" y1="30" x2="30" y2="30" stroke="#2c3e50" strokeWidth="3"/>
        <line x1="15" y1="50" x2="20" y2="40" stroke="#2c3e50" strokeWidth="3"/>
        <line x1="25" y1="50" x2="20" y2="40" stroke="#2c3e50" strokeWidth="3"/>
    </svg>
);

// SVG für Niemand (mit X-Kopf)
const NiemandSVG = ({ suitColor }: { suitColor: string }) => (
    <svg width="40" height="70" viewBox="0 0 40 70">
        {/* Kopf mit X */}
        <circle cx="20" cy="15" r="10" fill="#95a5a6" stroke="#000" strokeWidth="2"/>
        <line x1="14" y1="9" x2="26" y2="21" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <line x1="26" y1="9" x2="14" y2="21" stroke="white" strokeWidth="3" strokeLinecap="round"/>

        {/* Frack-Körper */}
        <rect x="10" y="25" width="20" height="25" fill={suitColor} rx="3"/>

        {/* Hemdkragen */}
        <polygon points="10,25 20,30 30,25" fill="white" opacity="0.4"/>

        {/* Beine */}
        <rect x="15" y="50" width="10" height="15" fill={suitColor}/>

        {/* Fliege */}
        <circle cx="25" cy="32" r="4" fill="white" opacity="0.6"/>
    </svg>
);

function App() {
    const [playerX, setPlayerX] = useState<number>(10);
    const [playerY, setPlayerY] = useState<number>(480); // WEITER UNTEN: 480 statt 420
    const [height, setHeight] = useState<number>(0);
    const [niemande, setNiemande] = useState<Niemand[]>([]);
    const [showSpeechBubble, setShowSpeechBubble] = useState<boolean>(false);
    const [reachedSummit, setReachedSummit] = useState<boolean>(false);
    const [gameActive, setGameActive] = useState<boolean>(true);
    const [textIndex, setTextIndex] = useState<number>(0);
    const [steps, setSteps] = useState<number>(0);
    const keysPressed = useRef<Set<string>>(new Set());
    const lastStepTime = useRef<number>(0);

    const kafkaText = [
        "Wenn niemand kommt, dann kommt eben niemand.",
        "Ich habe niemandem etwas Böses getan",
        "niemand hat mir etwas Böses getan",
        "niemand aber will mir helfen.",
        "Lauter niemand.",
        "Aber so ist es doch nicht.",
        "Nur daß mir niemand hilft",
        "sonst wäre lauter niemand hübsch",
        "Ich würde ganz gern — warum denn nicht",
        "einen Ausflug mit einer Gesellschaft von lauter Niemand\n" +
        "machen",
        "Natürlich ins Gebirge, wohin denn sonst?",
        "Wie sich diese Niemand aneinander drängen",
        "diese vielen quer gestreckten und eingehängten Arme",
        "diese vielen Füße, durch winzige Schritte getrennt!",
        "Versteht sich, daß alle in Frack sind.",
        "Wir gehen so lala, der Wind fährt durch die Lücken",
        "Die Hälse werden im Gebirge frei!",
        "Es ist ein Wunder, daß wir nicht singen.",
    ];

    const SUMMIT_X = 50;
    const SUMMIT_Y = 180;
    const GROUND_LEVEL = 500; // Boden nach unten verschoben

    // Steuerung mit verbessertem Scroll-Prevention
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];

            if (arrowKeys.includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();

                // Nur aktiv, wenn Spiel läuft
                if (gameActive && !reachedSummit) {
                    keysPressed.current.add(e.key);
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];

            if (arrowKeys.includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                keysPressed.current.delete(e.key);
            }
        };

        // Event-Listener mit capture phase für bessere Kontrolle
        window.addEventListener('keydown', handleKeyDown, { capture: true });
        window.addEventListener('keyup', handleKeyUp, { capture: true });

        return () => {
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
            window.removeEventListener('keyup', handleKeyUp, { capture: true });
        };
    }, [gameActive, reachedSummit]);

    // Spiel-Loop
    useEffect(() => {
        if (!gameActive || reachedSummit) return;

        const gameLoop = setInterval(() => {
            const now = Date.now();
            let moved = false;
            let newX = playerX;
            let newY = playerY;

            if (keysPressed.current.has('ArrowUp')) {
                newY -= 4;
                moved = true;
            }
            if (keysPressed.current.has('ArrowDown')) {
                newY += 4;
                moved = true;
            }
            if (keysPressed.current.has('ArrowLeft')) {
                newX -= 1;
                moved = true;
            }
            if (keysPressed.current.has('ArrowRight')) {
                newX += 1;
                moved = true;
            }

            if (moved && now - lastStepTime.current > 100) {
                setSteps(prev => prev + 1);
                lastStepTime.current = now;

                setTextIndex(prev => (prev + 1) % kafkaText.length);

                // NIEMANDE SPAWNEN NUR BEI JEDEM ZWEITEN SCHRITT
                if (!reachedSummit && steps < 120) { // Maximal 120 Niemande
                    // Nur bei ungerader Schrittanzahl spawnen (jeder 2. Schritt)
                    if (steps % 2 === 0) {
                        // Zufällige Position sehr nah am Spieler
                        const spawnDirection = Math.random() > 0.5 ? 1 : -1; // Links oder rechts
                        const offsetX = spawnDirection * (5 + Math.random() * 15); // Sehr nah: 5-20 Pixel seitlich
                        const offsetY = 5 + Math.random() * 10; // Sehr nah: 5-15 Pixel tiefer

                        const newNiemand: Niemand = {
                            id: Date.now() + Math.random(),
                            x: playerX + offsetX, // Sehr nah am Spieler
                            y: playerY + offsetY, // Direkt hinter/neben dem Spieler
                            suitColor: getRandomSuitColor(),
                            speed: 0.3 + Math.random() * 0.3, // Etwas schneller
                        };
                        setNiemande(prev => [...prev.slice(-60), newNiemand]); // Nur die letzten 60 behalten
                    }
                }
            }

            // Grenzen mit neuem Bodenlevel
            newX = Math.max(5, Math.min(95, newX));
            newY = Math.max(SUMMIT_Y, Math.min(GROUND_LEVEL, newY)); // Neuer Boden

            const currentHeight = GROUND_LEVEL - newY;
            setHeight(Math.max(0, Math.round(currentHeight / 2.5))); // Angepasste Höhenberechnung

            setPlayerX(newX);
            setPlayerY(newY);

            // Gipfel erreicht?
            const distanceToSummit = Math.sqrt(
                Math.pow(newX - SUMMIT_X, 2) + Math.pow(newY - SUMMIT_Y, 2)
            );

            if (distanceToSummit < 25 && !reachedSummit && newY <= SUMMIT_Y + 30) {
                setReachedSummit(true);
                setTextIndex(kafkaText.length - 1);
                setPlayerX(SUMMIT_X);
                setPlayerY(SUMMIT_Y);

                // Niemande verschwinden lassen
                setNiemande([]);
            }

            // Niemande folgen dem Spieler - JETZT MIT ENGEREM ABSTAND
            if (!reachedSummit) {
                setNiemande(prev => prev.map(n => {
                    const dx = playerX - n.x;
                    const dy = playerY - n.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 0.1) return n;

                    const dirX = dx / distance;
                    const dirY = dy / distance;

                    let newNX = n.x + dirX * n.speed;
                    let newNY = n.y + dirY * n.speed;

                    // ENGERER MINIMALABSTAND: 15 statt 20
                    const minDistance = 15;
                    if (distance < minDistance) {
                        newNX = n.x - dirX * n.speed * 0.3;
                        newNY = n.y - dirY * n.speed * 0.3;
                    }

                    newNX = Math.max(5, Math.min(95, newNX));
                    newNY = Math.max(SUMMIT_Y, Math.min(GROUND_LEVEL, newNY));

                    return {
                        ...n,
                        x: newNX,
                        y: newNY,
                    };
                }));
            }

        }, 16);

        return () => clearInterval(gameLoop);
    }, [gameActive, reachedSummit, playerX, playerY, textIndex, steps]);

    const getRandomSuitColor = (): string => {
        const colors = ['#1a1a1a', '#2c2c2c', '#3d3d3d', '#000000', '#121212'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    const handleScream = (): void => {
        if (!gameActive) return;
        setShowSpeechBubble(true);
        setTimeout(() => setShowSpeechBubble(false), 1500);
    };

    const resetGame = (): void => {
        setPlayerX(10);
        setPlayerY(480); // Zurück zum neuen Startpunkt
        setHeight(0);
        setNiemande([]);
        setReachedSummit(false);
        setGameActive(true);
        setTextIndex(0);
        setSteps(0);
    };

    return (
        <div className="App" tabIndex={0}>
            <header className="header">
                <h1>Kafka's Bergausflug</h1>
                <p className="subtitle">Steige den Berg hinauf - die Niemande folgen dir</p>
            </header>

            <div className="game-container">
                {/* Große Hauptüberschrift */}
                <h1 className="main-title">Ausflug ins Gebirge - Franz Kafka</h1>

                <div className="game-area">
                    <div className="sky">
                        <div className="cloud cloud1"></div>
                        <div className="cloud cloud2"></div>
                        <div className="sun"></div>
                    </div>

                    <div className="mountains">
                        <div className="mountain-left"></div>
                        <div className="mountain-right"></div>
                        <div className="mountain-main">
                            <div className="mountain-cross">✟</div>
                        </div>
                        <div className="mountain-foreground"></div>
                    </div>

                    <div className="text-display-top">
                        <div className="text-bubble">
                            <div className="text-content">
                                "{kafkaText[textIndex]}"
                            </div>
                        </div>
                    </div>

                    <div className="play-area">
                        {!reachedSummit && niemande.map((n) => (
                            <div
                                key={n.id}
                                className="niemand-container"
                                style={{
                                    left: `${n.x}%`,
                                    top: `${n.y}px`,
                                }}
                            >
                                <NiemandSVG suitColor={n.suitColor} />
                            </div>
                        ))}

                        <div
                            className="player-container"
                            style={{
                                left: `${playerX}%`,
                                top: `${playerY}px`
                            }}
                        >
                            {showSpeechBubble && (
                                <div className="speech-bubble">
                                    <div className="bubble-content">
                                        <div className="empty-speech">······</div>
                                    </div>
                                    <div className="bubble-tail"></div>
                                </div>
                            )}

                            <div className="player-figure">
                                <PlayerSVG />
                                {reachedSummit}
                            </div>
                        </div>
                    </div>

                    {/* Vereinfachte Verdunkelung */}
                    {reachedSummit && (
                        <div className="summit-darken">
                            <div className="summit-darken-content">

                            </div>
                        </div>
                    )}
                </div>

                <div className="scream-section" onClick={handleScream}>
                    <div className="scream-quote">
                        <span className="quote-mark">"</span>
                        <span className="quote-text">Ich weiß nicht, ich weiß ja nicht</span>
                        <span className="quote-mark">"</span>
                        <div className="click-hint">(Klicken um zu Schreien)</div>
                    </div>
                </div>

                <div>
                    <div className="kafka-text">
                        ______________________________________________________________________________________
                    </div>
                </div>

            </div>
        </div>
    );
}

export default App;