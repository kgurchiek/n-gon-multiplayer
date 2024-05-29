const { WebSocketServer } = require('ws');

const sessions = {};

function genID() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id
}

const wss = new WebSocketServer({
    port: 80,
})

wss.on('connection', (ws) => {
    let state = 0;
    let session;

    ws.on('error', console.error);

    ws.on('message', (data) => {
        console.log('Received:', data);
        const id = data[0];
        data = data.subarray(1);
        if (id == 0) {
            if (state == 0) {
                const id = genID();
                sessions[id] = { ws, offer: data };
                session = sessions[id];
                ws.send(`\x00${id}`);
                state++;
            } else if (state == 1) session.ws2.send(`\x01${data}`);
        } else if (id == 1) {
            if (state == 0) {
                session = sessions[data.toString()];
                if (session == null) {
                    ws.send('\x02Session not found');
                    ws.close();
                    return;
                }
                session.ws2 = ws;
                ws.send(`\x00${session.offer}`);
                state++;
            } else if (state == 1) {
                session.ws.send(`\x00${data}`);
                state++;
            } else if (state == 2) {
                session.ws.send(`\x01${data}`);
            }
        } else {
            ws.send('\x02Invalid role id');
            ws.close();
            return;
        }
    });

    ws.on('close', () => {
        if (session?.ws && session.ws.readyState == 1) session.ws.close();
        if (session?.ws2 && session.ws2.readyState == 1) session.ws2.close();
        delete sessions[session];
    });
});