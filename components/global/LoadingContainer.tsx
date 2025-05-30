import { CardContent  , Card} from "../ui/card";
import { Skeleton } from "../ui/skeleton";

function LoadingContainer() {
  return (
    <div className="pt-12 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <LoadingProduct />
      <LoadingProduct />
      <LoadingProduct />
    </div>
  );
}

function LoadingProduct() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-48 w-full"></Skeleton>
        <Skeleton className="h-4 w-3/4 mt-4"></Skeleton>
        <Skeleton className="h-4 w-1/2 mt-4"></Skeleton>
      </CardContent>
    </Card>
  );
}
export default LoadingContainer;
