import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Button,
  Modal,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons"; // Import icons for custom checkbox
import { Colors, Fonts, Spacing, Borders } from "../Theme";
import casesData from "../data/cases_filtered_json.json";
import surgeries from "../data/surgeries.json";
import { useSurgery } from "../context/SurgeryContext";
import VitalsDataSection from "../components/VitalsDataSection";

// Custom checkbox component
const CustomCheckBox = ({ isChecked, onPress, label }) => (
  <TouchableOpacity style={styles.checkBoxItem} onPress={onPress}>
    <MaterialIcons
      name={isChecked ? "check-box" : "check-box-outline-blank"}
      size={24}
      color={Colors.primary}
    />
    <Text style={styles.checkBoxLabel}>{label}</Text>
  </TouchableOpacity>
);

const selectRandomCase = (cases) => {
  const randomIndex = Math.floor(Math.random() * cases.length);
  return cases[randomIndex];
};

const DetailedOR = ({ route, navigation }) => {
  const { orId } = route.params;
  const { orData, getSurgerySteps } = useSurgery();
  const or = orData.find((o) => o.id === orId);

  const [isTechModalVisible, setIsTechModalVisible] = useState(false);
  const [equipmentRequests, setEquipmentRequests] = useState({
    arterialLine: false,
    glidescope: false,
    POCUS: false,
    vascularUltrasound: false,
    CO2Absorber: false,
  });

  const steps = getSurgerySteps(or.surgeryType);
  const currentStepIndex = steps.indexOf(or.surgeryStage);

  const getCompletionPercentage = (surgeryType, currentStep) => {
    const surgery = surgeries.find((s) => s.surgeryType === surgeryType);
    if (surgery) {
      const totalSteps = surgery.steps.length;
      const currentStepIndex = surgery.steps.indexOf(currentStep) + 1;
      const percentage = (currentStepIndex / totalSteps) * 100;
      return `${percentage.toFixed(0)}% Complete (Stage ${currentStepIndex}/${totalSteps})`;
    }
    return "0% Complete";
  };

  const [surgeryInfo, setSurgeryInfo] = useState(selectRandomCase(casesData));
  const opStart = surgeryInfo.opstart;
  const [operationStartTime, setOperationStartTime] = useState("");

  useEffect(() => {
    const currentTime = new Date();
    const opStartDate = new Date(currentTime.getTime() - opStart * 1000);
    const opStartString = opStartDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setOperationStartTime(opStartString);
  }, [surgeryInfo.opstart]);

  const formatLabel = (label) =>
    label.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

  const handleSubmitRequest = () => {
    const selectedRequests = Object.keys(equipmentRequests).filter(
      (item) => equipmentRequests[item],
    );
    Alert.alert(
      "Request Submitted",
      `Equipment requested: ${selectedRequests.join(", ")}`,
    );
    setIsTechModalVisible(false); // Close the modal after submitting
  };

  const handleEmergencyAlert = async () => {
    try {
      const response = await fetch("http://10.0.0.55:8081/send-notification", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Emergency Alert!",
          body: `Emergency in Operating Room Number ${or.id}!`,
          data: { orId: or.id },
          priority: "high",
        }),
      });
      console.log("Emergency notification sent:", response);
    } catch (error) {
      console.error("Error sending emergency notification:", error);
    }
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        {/* Display OR and surgery details */}
        <View style={styles.detailBox}>
          <Text style={styles.title}>{or.id}</Text>
          <Text style={styles.detailText}>Surgeon Name: {or.surgeonName}</Text>
          <Text style={styles.detailText}>
            {or.replacement
              ? `Anesthesia: ${or.raName} (${or.shift}) → ${or.replacement.name} (${or.replacement.shift})`
              : `Anesthesia: ${or.raName} (${or.shift}) → finish case`}
          </Text>
          <Text style={styles.detailText}>Surgery Type: {or.surgeryType}</Text>
          <Text style={styles.detailText}>
            Surgery Stage: {or.surgeryStage}
          </Text>
          <Text style={styles.detailText}>
            Surgery Progression:{" "}
            {getCompletionPercentage(or.surgeryType, or.surgeryStage)}
          </Text>
          <Text style={styles.detailText}>
            Operation Start Time: {operationStartTime}
          </Text>
        </View>

        {/* Vitals Section */}
        <VitalsDataSection />

        {/* Button Section with consistent spacing */}
        <View style={styles.buttonWrapper}>
          {/* Surgery Progression Button */}
          <TouchableOpacity
            style={[styles.baseButton, styles.primaryButton]}
            onPress={() => navigation.navigate("PushNotifications", { or: or })}
          >
            <Text style={styles.buttonText}>Surgery Progression</Text>
          </TouchableOpacity>

          {/* Anesthesia Tech Button */}
          <TouchableOpacity
            style={[styles.baseButton, styles.primaryButton]}
            onPress={() => setIsTechModalVisible(true)}
          >
            <Text style={styles.buttonText}>Anesthesia Tech</Text>
          </TouchableOpacity>

          {/* Emergency Button */}
          <TouchableOpacity
            style={[styles.baseButton, styles.emergencyButton]}
            onPress={handleEmergencyAlert}
          >
            <Text style={styles.buttonText}>Emergency in OR</Text>
          </TouchableOpacity>
        </View>

        {/* Modal for Tech Options */}
        <Modal
          visible={isTechModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsTechModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Anesthesia Tech Options</Text>

              {/* Call Tech Button */}
              <TouchableOpacity
                style={[styles.baseButton, styles.secondaryButton]}
              >
                <Text style={styles.buttonText}>Call Tech</Text>
              </TouchableOpacity>

              {/* Quick Request Section */}
              <Text style={styles.quickRequestTitle}>Quick Request:</Text>
              <View style={styles.checkBoxContainer}>
                {Object.keys(equipmentRequests).map((item) => (
                  <CustomCheckBox
                    key={item}
                    label={formatLabel(item)}
                    isChecked={equipmentRequests[item]}
                    onPress={() =>
                      setEquipmentRequests((prevState) => ({
                        ...prevState,
                        [item]: !prevState[item],
                      }))
                    }
                  />
                ))}
              </View>

              {/* Submit Request Button */}
              <TouchableOpacity
                style={[styles.baseButton, styles.primaryButton]}
                onPress={handleSubmitRequest}
              >
                <Text style={styles.buttonText}>Submit Request</Text>
              </TouchableOpacity>

              <Button
                title="Close"
                onPress={() => setIsTechModalVisible(false)}
              />
            </View>
          </View>
        </Modal>

        <TouchableOpacity
          style={[styles.baseButton, styles.secondaryButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.medium,
  },
  detailBox: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Borders.radius.medium,
    padding: Spacing.medium,
    marginVertical: Spacing.small,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: Fonts.size.large,
    fontFamily: Fonts.family.bold,
    color: Colors.primary,
    marginBottom: Spacing.small,
  },
  detailText: {
    fontSize: Fonts.size.medium,
    fontFamily: Fonts.family.regular,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: Fonts.size.medium,
    fontFamily: Fonts.family.bold,
  },
  baseButton: {
    borderRadius: Borders.radius.medium,
    paddingVertical: Spacing.medium,
    alignItems: "center",
    marginBottom: Spacing.small, // Consistent spacing
    width: "100%",
  },
  primaryButton: {
    backgroundColor: Colors.primary, // Primary color for standard buttons
  },
  secondaryButton: {
    backgroundColor: Colors.secondary, // Secondary color for "Go Back" button
  },
  emergencyButton: {
    backgroundColor: "red", // Red color for emergency button
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#FFF",
    padding: Spacing.medium,
    borderRadius: Borders.radius.medium,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: Fonts.size.large,
    fontFamily: Fonts.family.bold,
    color: Colors.primary,
    marginBottom: Spacing.small,
    textAlign: "center",
  },
  callButton: {
    backgroundColor: Colors.secondary,
    borderRadius: Borders.radius.medium,
    paddingVertical: Spacing.medium,
    alignItems: "center",
    marginVertical: Spacing.small,
  },
  quickRequestTitle: {
    fontSize: Fonts.size.large,
    fontFamily: Fonts.family.bold,
    marginBottom: Spacing.small,
    color: Colors.primary,
  },
  checkBoxContainer: {
    marginVertical: Spacing.small,
  },
  checkBoxItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  checkBoxLabel: {
    fontSize: Fonts.size.medium,
    fontFamily: Fonts.family.bold,
    marginLeft: Spacing.small,
    textTransform: "capitalize",
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: Borders.radius.medium,
    paddingVertical: Spacing.medium,
    alignItems: "center",
    marginVertical: Spacing.small,
  },
  buttonWrapper: {
    marginVertical: Spacing.medium,
  },
});

export default DetailedOR;
