import { Button } from '@/components/ui/button.tsx'
import { Card } from '@/components/ui/card.tsx'
import { MouseEvent } from 'react'

type PampButtonProps = {
    message: string
    onClick?: (event?: MouseEvent<HTMLDivElement>) => void
}
export default function PampButton({ message, onClick }: PampButtonProps) {
    return (
        <Card
            className="p-4 flex flex-row items-center w-fit"
            style={{ cursor: 'pointer' }}
            onClick={(event) => onClick?.(event)}
        >
            <Button size="icon" className="border-1 border-ring">
                +
            </Button>
            {message}
        </Card>
    )
}
