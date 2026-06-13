import './ui/ui.css';
import { Game } from './core/Game';

// Entry point: grab the canvas + UI overlay, boot the game, and start the loop.
const canvas = document.getElementById('game') as HTMLCanvasElement;
const uiRoot = document.getElementById('ui-root') as HTMLElement;

if (!canvas || !uiRoot) {
  throw new Error('Missing #game canvas or #ui-root element');
}

const game = new Game(canvas, uiRoot);
game.start();

// Handy for debugging in the browser console during development.
(window as unknown as { game: Game }).game = game;
