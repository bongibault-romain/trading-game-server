import Offer from "./offer";
import Player from "./player";

export default interface Room {
    id: string;
    players: Player[];
    offer: Offer | null;
}