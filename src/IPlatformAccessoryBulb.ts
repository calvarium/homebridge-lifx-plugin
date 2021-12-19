export default interface IPlatformAccessoryBulb{
    setHardwareCharacteristics: () => void;
    bindCharacteristics: () => void;
    updateCharacteristics: () => void;
}