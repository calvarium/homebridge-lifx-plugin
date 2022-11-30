export default interface HardwareInfo{

        productId: number;
        vendorName: string;
        productName: string;
        productFeatures: {
            color: boolean;
            chain: boolean;
            matrix: boolean;
            infrared: boolean;
            multizone: boolean;
            temperature_range?: number[];
            min_ext_mz_firmware?: undefined;
            min_ext_mz_firmware_components?: undefined;
            relays?: undefined;
            buttons?: undefined;
            hev?: undefined;
        };
        upgrades: [];

}