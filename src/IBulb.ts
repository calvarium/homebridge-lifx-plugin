export default interface IBulb{
    Initialise: (callback: () => void, error: (err: string) => void) => void;

    getName:() => string;
    getVersion:() => string;
    getSerialNumber:() => string;
    getVendorName:() => string;
    getProductName:() => string;

    getOn:() => boolean;
    getBrightness:() => number;
    getHue?:() => number;
    getSaturation?:() => number;
    getColorTemperatur?:() => number;

    setOn: (value: number) => void;
    setBrightness: (value: number) => void;
    setHue?: (value: number) => void;
    setSaturation?: (value: number) => void;
    setColorTemperatur?: (value: number) => void;

    pollStates: (callback: () => void) => void;

}