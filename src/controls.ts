import { Player } from './player';

interface GameInterface {
    gameOver: () => void;
}

export class Controls {
    private player: Player;
    private touchStartX: number = 0;
    private touchStartY: number = 0;
    private minSwipeDistance: number = 30;

    constructor(player: Player, _game: GameInterface) {
        this.player = player;

        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                this.player.moveLeft();
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                this.player.moveRight();
            } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
                this.player.jump();
            }
        });

        // Touch
        window.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        });

        window.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            this.handleSwipe(this.touchStartX, this.touchStartY, touchEndX, touchEndY);
        });
    }

    private handleSwipe(x1: number, y1: number, x2: number, y2: number) {
        const dx = x2 - x1;
        const dy = y2 - y1;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal swipe
            if (Math.abs(dx) > this.minSwipeDistance) {
                if (dx > 0) this.player.moveRight();
                else this.player.moveLeft();
            }
        } else {
            // Vertical swipe
            if (Math.abs(dy) > this.minSwipeDistance) {
                if (dy < 0) this.player.jump();
            }
        }
    }
}
