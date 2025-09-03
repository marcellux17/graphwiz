import { defineConfig } from 'vite';

export default defineConfig({
  base: '/graphwiz/', 
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        bfs: 'bfs.html',
        dfs: 'dfs.html',
        dijkstra: 'dijkstra.html',
        kruskal: 'kruskal.html',
        prim: 'prim.html',
        a_star: 'a_star.html',
        bellman: 'bellman_ford.html'
      }
    }
  }
});
