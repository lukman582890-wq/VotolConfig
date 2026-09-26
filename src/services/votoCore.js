// Core Votol Communication Logic (Shared between Electron and Android)

export const getMotorModel = (id) => {
    const models = { 0x05: 'EM-30s', 0x0A: 'EM-50s', 0x14: 'EM-100s', 0x1E: 'EM-150s', 0x28: 'EM-200s' };
    return models[id] || `0x${id.toString(16).toUpperCase()}`;
};

export const getVoltageLabel = (id) => {
    const volts = { 0: '48V', 1: '60V', 2: '72V', 3: '84V', 4: '96V' };
    return volts[id] || `ID:${id}`;
};

export const set16 = (buf, idx, val) => {
    buf[idx] = (val >> 8) & 0xFF;
    buf[idx + 1] = val & 0xFF;
};

export const get16 = (buf, startIdx) => {
    return (buf[startIdx] << 8) | buf[startIdx + 1];
};

export const buildChecksum = (packet) => {
    let xor = 0;
    for (const byte of packet) xor ^= byte;
    return xor;
};

export const buildLDGET = () => {
    const LDGET = Buffer.from('C914024C444745540000000000000000000000000000', 'hex');
    const xor = buildChecksum(LDGET);
    return Buffer.concat([LDGET, Buffer.from([xor, 0x0D])]);
};

export const buildWritePacket = (pageNum, rawPage, data, pdPage3) => {
    const b = Buffer.from(rawPage);
    const d = data;

    if (pageNum === 1) {
        b[0] = d.model || b[0];
        b[1] = d.batteryVoltage || b[1];
        if (d.overvoltage !== undefined) set16(b, 2, Math.round(d.overvoltage * 10));
        if (d.undervoltageSoft !== undefined) set16(b, 4, Math.round(d.undervoltageSoft * 10));
        b[6] = d.undervoltageVar !== undefined ? Math.round(d.undervoltageVar * 10) : b[6];
        if (d.busCurrent !== undefined) set16(b, 7, d.busCurrent);
        if (d.phaseCurrent !== undefined) set16(b, 9, d.phaseCurrent);
        if (d.undervoltage !== undefined) set16(b, 11, Math.round(d.undervoltage * 10));
        if (d.volCal !== undefined) set16(b, 13, d.volCal);
        if (d.curCal !== undefined) set16(b, 15, d.curCal);
    } else if (pageNum === 2) {
        if (d.busCurrentLimit !== undefined) set16(b, 0, d.busCurrentLimit);
        if (d.lowSpeedRatio !== undefined) b[2] = d.lowSpeedRatio;
        if (d.midSpeedRatio !== undefined) b[3] = d.midSpeedRatio;
        if (d.highSpeedRatio !== undefined) b[4] = d.highSpeedRatio;
        if (d.fluxWeaken1 !== undefined) {
            console.log(`[UsbSerial Debug] Page 2 - Flux Weaken (Primary): ${d.fluxWeaken1}`);
            set16(b, 5, d.fluxWeaken1);
        }
        if (d.higeFlux1 !== undefined) {
            console.log(`[UsbSerial Debug] Page 2 - Hige Flux (Primary): ${d.higeFlux1}`);
            set16(b, 7, d.higeFlux1);
        }
        if (d.midFlux1 !== undefined) {
            console.log(`[UsbSerial Debug] Page 2 - Mid Flux (Primary): ${d.midFlux1}`);
            set16(b, 9, d.midFlux1);
        }

        let flags = b[11];
        flags &= ~0xBF;
        if (d.speedLimEnable) flags |= 0x01;
        if (d.defGear === 'MID') flags |= 0x02;
        else if (d.defGear === 'LOW') flags |= 0x04;
        // HIGH is 0x00 (bits off)
        if (d.motorType === 'VTYPE') flags |= 0x10;
        if (d.controlType === 'SWITCH') flags |= 0x20;
        if (d.softStart) flags |= 0x80;
        b[11] = flags;

        if (d.speedLimRatio !== undefined) b[12] = d.speedLimRatio;
        if (d.softStartGrade !== undefined) b[13] = d.softStartGrade;
        if (d.logoutTime !== undefined) b[14] = d.logoutTime;
        if (d.recoveryTime !== undefined) b[15] = d.recoveryTime;
        if (d.fluxComp !== undefined) b[16] = d.fluxComp;
    } else if (pageNum === 3) {
        if (d.hallAngle !== undefined) {
            const angle = parseInt(d.hallAngle);
            if (angle < 0) { b[0] = 0xFF; b[1] = 256 + angle; }
            else { b[0] = 0x00; b[1] = angle; }
        }
        if (d.polePairs !== undefined) b[13] = d.polePairs;
        if (d.reverseRpm !== undefined) b[11] = d.reverseRpm;
        if (d.eabsPercent !== undefined) b[14] = d.eabsPercent;

        let flags = b[12];
        flags &= ~0xFC;
        if (d.outputType === 'One-Lin') flags |= 0x04;
        if (d.hillHold) flags |= 0x08;
        if (d.exchPhase) flags |= 0x10;
        if (d.exchHall) flags |= 0x20;
        if (d.sportAutoOff) flags |= 0x40;
        if (d.motorRev) flags |= 0x80;
        b[12] = flags;
    } else if (pageNum === 4) {
        let flags = b[0];
        flags &= ~0x1F;
        if (d.autoReverse) flags |= 0x01;
        if (d.hdcEnable) flags |= 0x02;
        if (pdPage3 && pdPage3.outputType === 'One-Lin') flags |= 0x04;
        else if (d.outputLin) flags |= 0x04;
        if (d.cruise) flags |= 0x08;
        if (d.doubleVoltage) flags |= 0x10;
        b[0] = flags;

        // B6-9 fixed to avoid overwriting MVB parameters incorrectly interpreted as calibration
        if (d.volCal !== undefined) set16(b, 1, d.volCal);
        if (d.curCal !== undefined) set16(b, 3, d.curCal);
        if (d.maxRpm !== undefined) set16(b, 5, d.maxRpm);
        if (d.gear1Ampe !== undefined) b[7] = d.gear1Ampe;
        if (d.gear2Ampe !== undefined) b[8] = d.gear2Ampe;
        if (d.gear3Ampe !== undefined) b[9] = d.gear3Ampe;
        if (d.fluxWeaken2 !== undefined) {
            console.log(`[UsbSerial Debug] Page 4 - Flux Weaken (Secondary): ${d.fluxWeaken2}`);
            set16(b, 10, d.fluxWeaken2);
        }
        if (d.higeFlux2 !== undefined) {
            console.log(`[UsbSerial Debug] Page 4 - Hige Flux (Secondary): ${d.higeFlux2}`);
            set16(b, 12, d.higeFlux2);
        }
        if (d.midFlux2 !== undefined) {
            console.log(`[UsbSerial Debug] Page 4 - Mid Flux (Secondary): ${d.midFlux2}`);
            set16(b, 14, d.midFlux2);
        }
        if (d.weakFluxCal !== undefined) {
            console.log(`[UsbSerial Debug] Page 4 - Flux Calibration: ${d.weakFluxCal}`);
            b[16] = Math.round(d.weakFluxCal / 10);
        }
    } else if (pageNum === 5 || pageNum === 6) {
        // Port mapping logic
        const m = (port, b1, b2) => {
            if (d[port]) {
                const enc = encodePort(d[port]);
                b[b1] = enc[0]; b[b2] = enc[1];
            }
        };
        if (pageNum === 5) {
            m('pd0', 0, 1); m('jtck', 2, 3); m('swd', 4, 5); m('pa11', 6, 7);
            m('pb3', 8, 9); m('pd1', 10, 11); m('pa12', 12, 13); m('pc15', 14, 15);
        } else {
            m('pa0', 0, 1); m('pb9', 2, 3); m('pb4', 4, 5); m('pa15', 6, 7);
            m('pb2', 8, 9); m('pc14', 10, 11); m('pb5', 12, 13); m('pd15', 14, 15);
        }
    } else if (pageNum === 7) {
        if (d.startVolt !== undefined) b[0] = Math.round(d.startVolt * 46);
        if (d.endVolt !== undefined) b[1] = Math.round(d.endVolt * 46);
        if (d.lowProtect !== undefined) b[2] = Math.round(d.lowProtect * 46);
        if (d.highProtect !== undefined) b[3] = Math.round(d.highProtect * 46);
        if (d.startTorque !== undefined) set16(b, 6, d.startTorque);
        if (d.combTorque !== undefined) set16(b, 8, d.combTorque);
    }

    const writeHdr = Buffer.from([0xC9, 0x14, 0x02, 0x50, pageNum]);
    const preXor = Buffer.concat([writeHdr, b]);
    const xor = buildChecksum(preXor);
    return Buffer.concat([preXor, Buffer.from([xor, 0x0D])]);
};

export const decodePort = (b1, b2) => {
    const sw = !!(b1 & 0x01);
    const modeVal = (b1 >> 1) & 0x03;
    const la = !!(b1 & 0x08);
    const io = !!(b2 & 0x80);
    const func = b2 & 0x7F;

    return {
        io, sw, la,
        mode: modeVal === 1 ? 'U' : (modeVal === 2 ? 'D' : 'F'),
        func: (func === 127 || func === 0xFF) ? 0 : func
    };
};

export const encodePort = (p) => {
    let b1 = 0xC0;
    if (p.sw) b1 |= 0x01;
    if (p.mode === 'U') b1 |= 0x02;
    else if (p.mode === 'D') b1 |= 0x04;
    if (p.la) b1 |= 0x08;

    let b2 = (p.func || 0) & 0x7F;
    if (p.io) b2 |= 0x80;

    return [b1, b2];
};

export const parsePage = (pageNum, p, pP6, pP7) => {
    if (pageNum === 1) {
        return {
            model: p[0],
            batteryVoltage: p[1],
            overvoltage: get16(p, 2) / 10,
            undervoltageSoft: get16(p, 4) / 10,
            undervoltageVar: p[6] / 10,
            busCurrent: get16(p, 7),
            phaseCurrent: get16(p, 9),
            undervoltage: get16(p, 11) / 10,
            volCal: get16(p, 13),
            curCal: get16(p, 15)
        };
    }
    if (pageNum === 2) {
        return {
            busCurrentLimit: get16(p, 0),
            lowSpeedRatio: p[2],
            midSpeedRatio: p[3],
            highSpeedRatio: p[4],
            fluxWeaken1: get16(p, 5),
            higeFlux1: get16(p, 7),
            midFlux1: get16(p, 9),
            speedLimEnable: !!(p[11] & 0x01),
            speedLimRatio: p[12],
            // Aligned with votol_reader.py: Bit 2 (4) -> LOW, Bit 1 (2) -> MEDI, else HIGH
            defGear: ((p[11] & 0x04) ? 'LOW' : ((p[11] & 0x02) ? 'MID' : 'HIGH')),
            motorType: (p[11] & 0x10) ? 'VTYPE' : 'SURFACE',
            controlType: (p[11] & 0x20) ? 'SWITCH' : 'BUTTON',
            softStart: !!(p[11] & 0x80),
            softStartGrade: p[13],
            logoutTime: p[14],
            recoveryTime: p[15],
            fluxComp: p[16]
        };
    }
    if (pageNum === 3) {
        return {
            hallAngle: p[0] === 0xFF ? -(256 - p[1]) : p[1],
            tempAlta: p[2],
            tempSobre: p[3],
            tempLimite: p[4],
            tc1: get16(p, 5),
            tc2: get16(p, 7),
            tc3: get16(p, 9),
            polePairs: p[13],
            reverseRpm: p[11],
            eabsPercent: p[14],
            outputType: (p[12] & 0x04) ? 'One-Lin' : 'Hall',
            hillHold: !!(p[12] & 0x08),
            exchPhase: !!(p[12] & 0x10),
            exchHall: !!(p[12] & 0x20),
            sportAutoOff: !!(p[12] & 0x40),
            motorRev: !!(p[12] & 0x80),
            swVersion: p[15], // B20
            hwVersion: p[16]  // B21
        };
    }
    if (pageNum === 4) {
        return {
            autoReverse: !!(p[0] & 0x01),
            hdcEnable: !!(p[0] & 0x02),
            outputLin: !!(p[0] & 0x04),
            cruise: !!(p[0] & 0x08),
            doubleVoltage: !!(p[0] & 0x10),
            // B6-B9 are MVB parameters, not calibration (Skipping)
            volCal: get16(p, 1),
            curCal: get16(p, 3),
            maxRpm: get16(p, 5),
            gear1Ampe: p[7],
            gear2Ampe: p[8],
            gear3Ampe: p[9],
            fluxWeaken2: get16(p, 10),
            higeFlux2: get16(p, 12),
            midFlux2: get16(p, 14),
            weakFluxCal: p[16] * 10,
            startVolt: pP7 ? Number((pP7[0] / 46).toFixed(2)) : 0,
            endVolt: pP7 ? Number((pP7[1] / 46).toFixed(2)) : 0,
            lowProtect: pP7 ? Number((pP7[2] / 46).toFixed(2)) : 0,
            highProtect: pP7 ? Number((pP7[3] / 46).toFixed(2)) : 0,
            rateDecline: pP7 ? pP7[4] : 0,
            rateRise: pP7 ? pP7[5] : 0,
            startTorque: pP7 ? get16(pP7, 6) : 0,
            combTorque: pP7 ? get16(pP7, 8) : 0
        };
    }
    if (pageNum === 5) {
        return {
            pd0: decodePort(p[0], p[1]),
            jtck: decodePort(p[2], p[3]),
            swd: decodePort(p[4], p[5]),
            pa11: decodePort(p[6], p[7]),
            pb3: decodePort(p[8], p[9]),
            pd1: decodePort(p[10], p[11]),
            pa12: decodePort(p[12], p[13]),
            pc15: decodePort(p[14], p[15]),
            pa0: decodePort(pP6[0], pP6[1]),
            pb9: decodePort(pP6[2], pP6[3]),
            pb4: decodePort(pP6[4], pP6[5]),
            pa15: decodePort(pP6[6], pP6[7]),
            pb2: decodePort(pP6[8], pP6[9]),
            pc14: decodePort(pP6[10], pP6[11]),
            pb5: decodePort(pP6[12], pP6[13]),
            pd15: decodePort(pP6[14], pP6[15])
        };
    }
    return null;
};
export const parseTelemetry = (packet) => {
    if (packet.length < 24) return null;

    // Telemetry response (CMD_SHOW)
    if (packet[0] === 0xC0 && packet[1] === 0x14 && packet[2] === 0x0D && packet[3] === 0x59) {
        // Alignment based on logs and Python reference:
        // [5-6] Voltage, [7-8] Current, [10-13] Fault Code, [14-15] RPM, 
        // [16] IC Temp, [17] Ex Temp, [18-19] Temp Coef, [20] fu_stat, [21] ic_stat
        const volt = packet.readUInt16BE(5) / 10;
        const current = packet.readInt16BE(7) / 10;
        const faultCode = packet.readUInt32BE(10) >>> 0;
        const rpm = packet.readUInt16BE(14);
        const ic_temp = packet[16] - 50;
        const ex_temp = packet[17] - 50;
        const temp_cf = packet.readUInt16BE(18);
        const fu_stat = packet[20];
        const ic_stat = packet[21];

        return {
            volt, current, rpm, ic_temp, ex_temp, temp_cf, fu_stat, ic_stat, faultCode
        };
    }
    return null;
};
export const buildRemoteControlPacket = (data) => {
    // base SHOW packet
    const SHOW = Buffer.alloc(24);
    SHOW[0] = 0xC9;
    SHOW[1] = 0x14;
    SHOW[2] = 0x02;
    SHOW[3] = 0x53; // 'S'
    SHOW[4] = 0x48; // 'H'
    SHOW[5] = 0x4F; // 'O'
    SHOW[6] = 0x57; // 'W'

    SHOW[12] = data.remoteEnabled ? 0x55 : 0xAA;

    // Throttle
    const throttleVal = Math.round((data.throttle || 0) * 5945);
    set16(SHOW, 13, throttleVal);

    // Flags
    let flags = 0x00;
    const gearIdx = ['L', 'M', 'H', 'S'].indexOf(data.gear);
    if (gearIdx !== -1) flags |= gearIdx;
    if (data.brake) flags |= 0x80;
    if (data.reverse) flags |= 0x40;
    if (data.lock) flags |= 0x20;
    SHOW[15] = flags;

    // Calibration
    // Inverse scale weakFluxCal back to raw byte (e.g. 30 -> 3)
    SHOW[16] = data.weakFluxCal !== undefined ? Math.round(data.weakFluxCal / 10) : 0;
    SHOW[17] = 0xAA;
    set16(SHOW, 18, data.volCal || 0);
    set16(SHOW, 20, data.curCal || 0);

    // XOR & End
    SHOW[22] = buildChecksum(SHOW.slice(0, 22));
    SHOW[23] = 0x0D;

    return SHOW;
};
