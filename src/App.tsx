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
    const [playerY, setPlayerY] = useState<number>(350);
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
        "Ich weiß nicht, ich weiß ja nicht",
        "Wenn niemand kommt, dann kommt eben niemand.",
        "Ich habe niemandem etwas Böses getan...",
        "niemand aber will mir helfen.",
        "Lauter niemand.",
        "Wie sich diese Niemand aneinander drängen...",
        "Wir gehen so lala, der Wind fährt durch die Lücken...",
        "Es ist ein Wunder, daß wir nicht singen.",
        "Allein am Gipfel. Die Niemande waren nur Begleiter, keine Gefährten."
    ];

    // Steuerung
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                keysPressed.current.add(e.key);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                keysPressed.current.delete(e.key);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Spiel-Loop
    useEffect(() => {
        if (!gameActive || reachedSummit) return;

        const gameLoop = setInterval(() => {
            const now = Date.now();
            let moved = false;
            let newX = playerX;
            let newY = playerY;

            if (keysPressed.current.has('ArrowUp')) {
                newY -= 2;
                moved = true;
            }
            if (keysPressed.current.has('ArrowDown')) {
                newY += 2;
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

            // Wenn Bewegung stattgefunden hat und genug Zeit vergangen ist
            if (moved && now - lastStepTime.current > 100) {
                setSteps(prev => prev + 1);
                lastStepTime.current = now;

                // Bei jedem Schritt: Textindex erhöhen (wenn nicht am Ende)
                if (textIndex < kafkaText.length - 1) {
                    setTextIndex(prev => prev + 1);
                }

                // Bei jedem Schritt: Einen neuen Niemand hinzufügen
                if (!reachedSummit) {
                    const newNiemand: Niemand = {
                        id: Date.now() + Math.random(),
                        x: playerX + (Math.random() * 60 - 30), // In der Nähe des Spielers
                        y: playerY + (Math.random() * 40 - 20),
                        suitColor: getRandomSuitColor(),
                        speed: 0.2 + Math.random() * 0.4,
                    };
                    setNiemande(prev => [...prev, newNiemand]);
                }
            }

            newX = Math.max(5, Math.min(95, newX));
            newY = Math.max(100, Math.min(380, newY));

            const currentHeight = 400 - newY;
            setHeight(Math.max(0, currentHeight));

            setPlayerX(newX);
            setPlayerY(newY);

            // Gipfel erreicht?
            if (newY <= 120 && !reachedSummit) {
                setReachedSummit(true);
                // Setze den letzten Text (Gipfeltext)
                setTextIndex(kafkaText.length - 1);
                setTimeout(() => {
                    setNiemande([]);
                }, 500);
            }

            // Niemande folgen dem Spieler
            if (!reachedSummit) {
                setNiemande(prev => prev.map(n => {
                    // Berechne Richtung zum Spieler
                    const dx = playerX - n.x;
                    const dy = playerY - n.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 0.1) return n;

                    // Normalisiere die Richtung
                    const dirX = dx / distance;
                    const dirY = dy / distance;

                    // Bewege Niemand in Richtung Spieler
                    let newNX = n.x + dirX * n.speed;
                    let newNY = n.y + dirY * n.speed;

                    // Halte minimalen Abstand
                    const minDistance = 25;
                    if (distance < minDistance) {
                        newNX = n.x - dirX * n.speed * 0.5;
                        newNY = n.y - dirY * n.speed * 0.5;
                    }

                    // Grenzen setzen
                    newNX = Math.max(5, Math.min(95, newNX));
                    newNY = Math.max(120, Math.min(380, newNY));

                    return {
                        ...n,
                        x: newNX,
                        y: newNY,
                    };
                }));
            }

        }, 16);

        return () => clearInterval(gameLoop);
    }, [gameActive, reachedSummit, playerX, playerY, height, textIndex]);

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
        setPlayerY(350);
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
                <div className="game-area">
                    {/* Himmel */}
                    <div className="sky">
                        <div className="cloud cloud1"></div>
                        <div className="cloud cloud2"></div>
                        <div className="sun"></div>
                    </div>

                    {/* Berge */}
                    <div className="mountains">
                        <div className="mountain-back"></div>
                        <div className="mountain-middle"></div>
                        <div className="mountain-front"></div>
                    </div>

                    {/* Text-Anzeige oben in der Mitte */}
                    <div className="text-display-top">
                        <div className="text-bubble">
                            <div className="text-content">
                                "{kafkaText[textIndex]}"
                            </div>
                            <div className="text-step">Schritt: {steps} | Niemande: {niemande.length}</div>
                        </div>
                    </div>

                    {/* Spielbereich */}
                    <div className="play-area">
                        {/* Niemande */}
                        {!reachedSummit && niemande.map((n) => (
                            <div
                                key={n.id}
                                className="niemand-container"
                                style={{
                                    left: `${n.x}%`,
                                    top: `${n.y}px`,
                                    opacity: reachedSummit ? 0 : 1,
                                    transition: reachedSummit ? 'opacity 0.5s ease' : 'none'
                                }}
                            >
                                <NiemandSVG suitColor={n.suitColor} />
                            </div>
                        ))}

                        {/* Spieler */}
                        <div
                            className="player-container"
                            style={{
                                left: `${playerX}%`,
                                top: `${playerY}px`
                            }}
                        >
                            {/* Sprechblase */}
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
                                {reachedSummit && <div className="summit-crown">👑</div>}
                            </div>
                        </div>

                        {/* Gipfel-Flagge */}
                        {reachedSummit && (
                            <div className="summit-flag" style={{ left: '50%', top: '100px' }}>
                                🚩
                            </div>
                        )}
                    </div>

                    {/* Gipfel-Overlay */}
                    {reachedSummit && (
                        <div className="summit-overlay">
                            <div className="summit-message">
                                <h2>🏔️ GIPFEL ERREICHT! 🏔️</h2>
                                <p>Du hast {steps} Schritte gemacht </p>
                                <p>Die Niemande sind verschwunden. Du bist allein am Gipfel.</p>
                                <button onClick={resetGame} className="restart-btn">
                                    Neues Spiel
                                </button>
                            </div>
                        </div>
                    )}
                </div>



                {/* Schreien-Button */}
                <div className="scream-section" onClick={handleScream}>
                    <div className="scream-quote">
                        <span className="quote-mark">"</span>
                        <span className="quote-text">Ich weiß nicht, ich weiß ja nich</span>
                        <span className="quote-mark">"</span>
                        <div className="click-hint">(Klicken um zu Schreien)</div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default App;