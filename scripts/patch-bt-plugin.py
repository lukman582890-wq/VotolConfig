from pathlib import Path

p = Path("node_modules/@yesprasoon/capacitor-bluetooth-communication/android/src/main/java/net/yesprasoon/plugins/capacitorbluetoothcommunication/BluetoothCommunicationPlugin.java")
if not p.exists():
    raise SystemExit(f"Bluetooth plugin source not found: {p}")

s = p.read_text()

if "import android.util.Base64;" not in s:
    s = s.replace("import android.util.Log;", "import android.util.Log;\nimport android.util.Base64;")

old_send = "outputStream.write(data.getBytes());"
new_send = "outputStream.write(Base64.decode(data, Base64.DEFAULT));"
if old_send in s:
    s = s.replace(old_send, new_send, 1)
elif new_send not in s:
    raise SystemExit("sendData binary write pattern not found")

old_recv = "String data = new String(buffer, 0, bytes, StandardCharsets.UTF_8);"
new_recv = "String data = Base64.encodeToString(buffer, 0, bytes, Base64.NO_WRAP);"
if old_recv in s:
    s = s.replace(old_recv, new_recv, 1)
elif new_recv not in s:
    raise SystemExit("dataReceived UTF-8 pattern not found")

p.write_text(s)
print("Patched BluetoothCommunicationPlugin.java for binary-safe Base64 transport.")
