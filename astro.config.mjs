// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
    integrations: [starlight({
        title: 'Matchina Router (POC)',
        social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
        sidebar: [
            {
            	label: 'Guides',
            	items: [
            		// Each item here is one entry in the navigation menu.
            		{ label: 'Usage', slug: 'guides/usage' },
            	],
            },
            {
                label: 'Examples',
                autogenerate: { directory: 'examples' },
            },
            // {
            // 	label: 'Notes',
            // 	autogenerate: { directory: 'notes' },
            // },
        ],
        customCss: ['./src/styles/global.css'],
		}), react()],
    vite: {
        plugins: [tailwindcss()],
    },
});