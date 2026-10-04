import { useState } from "react";
import { View } from "react-native";

import { InputOTP, type InputOTPStatus } from "@/registry/components/input-otp";
import { Text } from "@/registry/components/text";
import { createStyles } from "@/registry/theme";

const useStyles = createStyles((t) => ({ root: { gap: t.spacing[3] } }));

/** A 6-digit verification code: checked when complete; typing again clears the status. */
export function InputOTPDemo() {
  const styles = useStyles();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<InputOTPStatus>();

  return (
    <View style={styles.root}>
      <Text variant="label">Verification code</Text>
      <InputOTP
        aria-label="Verification code"
        value={code}
        onChangeText={(next) => {
          setCode(next);
          setStatus(undefined);
        }}
        onComplete={(full) => setStatus(full === "123456" ? "success" : "error")}
        status={status}
      />
      <Text variant="caption" color={status === "error" ? "destructive" : "mutedForeground"}>
        {status === "error" ? "That code is not right. Try 123456." : "Enter the code we sent you."}
      </Text>
    </View>
  );
}
