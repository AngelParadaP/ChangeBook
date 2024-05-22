'use-client';

import { UserCred } from "../interfaces/interfaces";
import { UserGridItem } from "./UserGridItem";

interface Props{
    products: UserCred[];
}

export const UsersGrid = ({products}: Props) => {
  return (
    <div className='grid grid-cols-2 sm:grid-cols-2 gap-10 mb-10 mx-3 bg-white'>
        {
            products.map( product => (
                <UserGridItem
                    key={ product.codigo }
                    product={ product }
                />
            ))
        }

    </div>
  )
}
