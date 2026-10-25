package fyi.rigel.riceyramen;

import android.os.Bundle;
import android.view.InputDevice;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Keep the screen awake while playing.
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    /** Full screen: hide the status and navigation bars; a swipe shows them briefly. */
    private void hideSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.hide(WindowInsetsCompat.Type.systemBars());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }

    // Controllers (like the AYN Thor's built-in one) are read here and passed to
    // the game's pad module (src/pad.ts) as window.__nativePad calls, instead of
    // relying on the WebView: older WebViews turn buttons into odd key events,
    // ignore the analog stick, and B would otherwise act as Android "Back".

    private static boolean fromController(int source) {
        return (source & InputDevice.SOURCE_GAMEPAD) == InputDevice.SOURCE_GAMEPAD
            || (source & InputDevice.SOURCE_JOYSTICK) == InputDevice.SOURCE_JOYSTICK;
    }

    /** The button names src/pad.ts uses, or null for keys the game doesn't need. */
    private static String buttonName(int keyCode) {
        switch (keyCode) {
            case KeyEvent.KEYCODE_BUTTON_A: return "a";
            case KeyEvent.KEYCODE_BUTTON_B: return "b";
            case KeyEvent.KEYCODE_BUTTON_X: return "x";
            case KeyEvent.KEYCODE_BUTTON_Y: return "y";
            case KeyEvent.KEYCODE_BUTTON_L1: return "lb";
            case KeyEvent.KEYCODE_BUTTON_R1: return "rb";
            case KeyEvent.KEYCODE_BUTTON_SELECT: return "select";
            case KeyEvent.KEYCODE_BUTTON_START: return "start";
            case KeyEvent.KEYCODE_DPAD_UP: return "up";
            case KeyEvent.KEYCODE_DPAD_DOWN: return "down";
            case KeyEvent.KEYCODE_DPAD_LEFT: return "left";
            case KeyEvent.KEYCODE_DPAD_RIGHT: return "right";
            default: return null;
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        String name = fromController(event.getSource()) ? buttonName(event.getKeyCode()) : null;
        if (name == null) return super.dispatchKeyEvent(event);
        if (event.getRepeatCount() == 0) {
            boolean down = event.getAction() == KeyEvent.ACTION_DOWN;
            sendToGame("button('" + name + "'," + down + ")");
        }
        return true;
    }

    @Override
    public boolean dispatchGenericMotionEvent(MotionEvent event) {
        if (!fromController(event.getSource()) || event.getAction() != MotionEvent.ACTION_MOVE) {
            return super.dispatchGenericMotionEvent(event);
        }
        // Left stick plus the hat (some controllers report the d-pad this way).
        sendToGame(String.format(Locale.ROOT, "axes(%.2f,%.2f,%.2f,%.2f)",
            event.getAxisValue(MotionEvent.AXIS_X), event.getAxisValue(MotionEvent.AXIS_Y),
            event.getAxisValue(MotionEvent.AXIS_HAT_X), event.getAxisValue(MotionEvent.AXIS_HAT_Y)));
        return true;
    }

    private void sendToGame(String call) {
        WebView view = getBridge() != null ? getBridge().getWebView() : null;
        if (view != null) view.post(() -> view.evaluateJavascript("window.__nativePad && window.__nativePad." + call, null));
    }
}
